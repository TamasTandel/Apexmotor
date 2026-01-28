const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function ensureTable() {
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "TestDriveBooking" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
      "carId" INTEGER NOT NULL REFERENCES "Car"(id) ON DELETE CASCADE,
      "locationId" INTEGER REFERENCES "Location"(id) ON DELETE SET NULL,
      "preferredDay" TIMESTAMP NOT NULL,
      "preferredTime" TEXT,
      status TEXT NOT NULL DEFAULT 'requested',
      notes TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );`;
  } catch { }
}

function authOptional(req, res, next) {
  const h = req.headers.authorization; if (!h) return next();
  try { const p = jwt.verify(h.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET); req.userId = p.userId; } catch { }
  next();
}
function auth(req, res, next) {
  const h = req.headers.authorization; if (!h) return res.status(401).json({ error: 'Missing auth' });
  try { const p = jwt.verify(h.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET); req.userId = p.userId; next(); } catch { return res.status(401).json({ error: 'Invalid token' }); }
}
async function adminOnly(req, res, next) {
  const u = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!u || u.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.post('/', authOptional, async (req, res) => {
  const { carId, preferredDay, preferredTime, locationId, notes } = req.body || {};
  if (!carId || !preferredDay) return res.status(400).json({ error: 'carId and preferredDay required' });
  const day = new Date(preferredDay);
  if (isNaN(day.getTime())) return res.status(400).json({ error: 'Invalid preferredDay' });
  await ensureTable();
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) return res.status(404).json({ error: 'Car not found' });
  try {
    const td = await prisma.testDriveBooking.create({ data: { userId: req.userId || null, carId: car.id, preferredDay: day, preferredTime, locationId: locationId || null, notes } });
    try { await prisma.auditLog.create({ data: { actorId: req.userId || null, action: 'TEST_DRIVE_REQUEST', targetType: 'CAR', targetId: car.id, metadata: { testDriveId: td.id } } }); } catch { }
    // notify
    try { await prisma.notification.create({ data: { userId: req.userId || 1, type: 'test_drive_request', payload: { testDriveId: td.id, carId: car.id } } }); } catch { }
    res.json(td);
  } catch (e) { res.status(500).json({ error: 'Failed to request' }); }
});

router.get('/me', auth, async (req, res) => {
  await ensureTable();
  const list = await prisma.testDriveBooking.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
  res.json(list);
});

router.get('/admin/list', auth, adminOnly, async (req, res) => {
  await ensureTable();
  const { status, page = 1, pageSize = 25 } = req.query;
  const where = {}; if (status) where.status = status;
  const p = Math.max(1, parseInt(page)); const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  const total = await prisma.testDriveBooking.count({ where });
  const list = await prisma.testDriveBooking.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (p - 1) * size, take: size });
  res.json({ requests: list, page: p, pageSize: size, total, totalPages: Math.ceil(total / size) });
});

router.patch('/admin/:id', auth, adminOnly, async (req, res) => {
  await ensureTable();
  const id = req.params.id;
  const { status } = req.body || {};
  if (status && !['requested', 'confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const existing = await prisma.testDriveBooking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.testDriveBooking.update({ where: { id }, data: { status } });
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'TEST_DRIVE_STATUS', targetType: 'TEST_DRIVE', targetId: id, metadata: { from: existing.status, to: status } } }); } catch { }
    res.json(updated);
  } catch { res.status(500).json({ error: 'Failed to update' }); }
});

module.exports = router;
