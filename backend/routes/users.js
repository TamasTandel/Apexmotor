const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// Configuration for root admin (only this account may access admin endpoints)
const ROOT_ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL || 'admin@123.com';

// Simple auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing auth header' });
  const token = header.replace(/^Bearer\s+/i, '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Register
router.post('/register', async (req, res) => {
  console.log('Register route hit:', req.body.email);
  const { email, password, name, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Auto-assign admin role if registering root admin email
    const role = email === ROOT_ADMIN_EMAIL ? 'admin' : 'user';
    const user = await prisma.user.create({ data: { email, password: hashedPassword, name, role, phone } });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('Registration error:', e);
    if (e.code === 'P2002') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login (auto-promote root admin if needed)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (user.locked) return res.status(403).json({ error: 'Account locked' });
  const valid = await bcrypt.compare(password, user.password);
  console.log('Password valid:', valid);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  if (email === ROOT_ADMIN_EMAIL && user.role !== 'admin') {
    try { await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } }); } catch {/* ignore */ }
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Current user info
router.get('/me', auth, async (req, res) => {
  // update lastSeenAt heartbeat
  try { await prisma.user.update({ where: { id: req.userId }, data: { lastSeenAt: new Date() } }); } catch { }
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true, role: true, phone: true, lastSeenAt: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Request password reset (issue token)
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true }); // do not reveal existence
  const token = require('crypto').randomBytes(24).toString('hex');
  const exp = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExp: exp } });
  // In production send email; here just return token for front-end demo
  res.json({ ok: true, token });
});

// Perform password reset
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExp: { gt: new Date() } } });
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed, resetToken: null, resetTokenExp: null } });
  res.json({ ok: true });
});

// Admin user list & management
async function adminOnly(req, res, next) {
  const u = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!u || u.role !== 'admin' || u.email !== ROOT_ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.get('/admin/users', auth, adminOnly, async (req, res) => {
  const { q, role, page = 1, pageSize = 25 } = req.query;
  const where = {};
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } }
    ];
  }
  const p = Math.max(1, parseInt(page));
  const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  const total = await prisma.user.count({ where });
  let users = await prisma.user.findMany({ where, orderBy: { id: 'asc' }, skip: (p - 1) * size, take: size, select: { id: true, email: true, name: true, role: true, locked: true } });
  // Attempt to enrich with phone/createdAt/lastSeenAt via raw fallback (ignore errors)
  try {
    const ids = users.map(u => u.id);
    if (ids.length) {
      const rows = await prisma.$queryRawUnsafe(`SELECT id, phone, "createdAt", "lastSeenAt" FROM "User" WHERE id IN (${ids.join(',')})`);
      const map = Object.fromEntries(rows.map(r => [r.id, r]));
      users = users.map(u => ({ ...u, phone: map[u.id]?.phone || null, createdAt: map[u.id]?.createdAt || null, lastSeenAt: map[u.id]?.lastSeenAt || null }));
    }
  } catch { }
  res.json({ users, page: p, pageSize: size, total, totalPages: Math.ceil(total / size) });
});

router.patch('/admin/users/:id/role', auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;
  if (!['user', 'admin', 'mechanic'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.user.update({ where: { id }, data: { role } });
  await prisma.auditLog.create({ data: { actorId: req.userId, action: 'USER_ROLE_CHANGE', targetType: 'USER', targetId: id, metadata: { from: existing.role, to: role } } });
  res.json({ id: updated.id, role: updated.role });
});

router.post('/admin/users/:id/lock', auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  const { lock = true } = req.body;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.user.update({ where: { id }, data: { locked: !!lock } });
  await prisma.auditLog.create({ data: { actorId: req.userId, action: lock ? 'USER_LOCK' : 'USER_UNLOCK', targetType: 'USER', targetId: id } });
  res.json({ id: updated.id, locked: updated.locked });
});

module.exports = router;

// Update phone (self)
router.patch('/me/profile', auth, async (req, res) => {
  const { phone, name } = req.body;
  const data = {};
  if (phone !== undefined) data.phone = phone;
  if (name !== undefined) data.name = name;
  if (!Object.keys(data).length) return res.json({ ok: true });
  const updated = await prisma.user.update({ where: { id: req.userId }, data, select: { id: true, email: true, name: true, phone: true } });
  res.json(updated);
});

// Wishlist (favorites)
router.get('/me/favorites', auth, async (req, res) => {
  const favs = await prisma.favorite.findMany({ where: { userId: req.userId }, include: { car: true }, orderBy: { createdAt: 'desc' } });
  // Return a normalized structure to help client robustly extract ids
  res.json(favs.map(f => ({ carId: f.carId, car: f.car })));
});

router.post('/me/favorites/:carId', auth, async (req, res) => {
  const carId = req.params.carId;
  try {
    await prisma.favorite.upsert({
      where: { userId_carId: { userId: req.userId, carId } },
      update: {},
      create: { userId: req.userId, carId }
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

router.delete('/me/favorites/:carId', auth, async (req, res) => {
  const carId = req.params.carId;
  try {
    await prisma.favorite.delete({ where: { userId_carId: { userId: req.userId, carId } } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// My notifications (user-scoped)
router.get('/me/notifications', auth, async (req, res) => {
  const { status, type, page = 1, pageSize = 50 } = req.query;
  const p = Math.max(1, parseInt(page));
  const size = Math.min(200, Math.max(1, parseInt(pageSize)));
  const where = { userId: req.userId };
  if (status) where.status = status;
  if (type) where.type = type;
  try {
    const total = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({ where, orderBy: { id: 'desc' }, skip: (p - 1) * size, take: size });
    res.json({ notifications, page: p, pageSize: size, total, totalPages: Math.ceil(total / size) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// Saved contact profile for purchases
async function ensureUserContactTable() {
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "UserContact" (
      "userId" INTEGER PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
      name TEXT,
      email TEXT,
      phone TEXT,
      location TEXT,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );`;
    await prisma.$executeRawUnsafe(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_contact_set_updated_at') THEN
        CREATE OR REPLACE FUNCTION set_updated_at_uc() RETURNS TRIGGER AS $$
        BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
        CREATE TRIGGER user_contact_set_updated_at BEFORE UPDATE ON "UserContact" FOR EACH ROW EXECUTE FUNCTION set_updated_at_uc();
      END IF;
    END$$;`);
  } catch { }
}

// Get my saved contact profile
router.get('/me/contact_profile', auth, async (req, res) => {
  try {
    await ensureUserContactTable();
    const rows = await prisma.$queryRaw`SELECT name, email, phone, location FROM "UserContact" WHERE "userId" = ${req.userId}`;
    const r = Array.isArray(rows) ? rows[0] : rows;
    res.json(r || {});
  } catch { res.json({}); }
});

// Update my saved contact profile
router.patch('/me/contact_profile', auth, async (req, res) => {
  const { name, email, phone, location } = req.body || {};
  try {
    await ensureUserContactTable();
    await prisma.$executeRaw`INSERT INTO "UserContact" ("userId", name, email, phone, location) VALUES (${req.userId}, ${name || null}, ${email || null}, ${phone || null}, ${location || null})
    ON CONFLICT ("userId") DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, location = EXCLUDED.location, "updatedAt" = NOW()`;
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to update contact profile' }); }
});
