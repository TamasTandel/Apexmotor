const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (header) {
    const token = header.replace(/^Bearer\s+/i, '');
    try { const p = jwt.verify(token, process.env.JWT_SECRET); req.userId = p.userId; } catch { /* ignore */ }
  }
  next();
}

function auth(req, res, next) {
  const header = req.headers.authorization; if (!header) return res.status(401).json({ error: 'Missing auth header' });
  try { const token = header.replace(/^Bearer\s+/i, ''); const p = jwt.verify(token, process.env.JWT_SECRET); req.userId = p.userId; next(); } catch { return res.status(401).json({ error: 'Invalid token' }); }
}
async function adminOnly(req, res, next) {
  const u = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!u || u.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

async function ensureTable() {
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "PurchaseRequest" (
      id SERIAL PRIMARY KEY,
      "carId" INTEGER NOT NULL,
      "userId" INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "carSnapshot" JSONB,
      CONSTRAINT fk_car FOREIGN KEY ("carId") REFERENCES "Car"(id) ON DELETE RESTRICT
    );`;
    // trigger to maintain updatedAt
    await prisma.$executeRawUnsafe(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'purchase_request_set_updated_at') THEN
        CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
        BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
        CREATE TRIGGER purchase_request_set_updated_at BEFORE UPDATE ON "PurchaseRequest" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
    END$$;`);
    // add optional columns when upgrading
    await prisma.$executeRawUnsafe('ALTER TABLE "PurchaseRequest" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "PurchaseRequest" ADD COLUMN IF NOT EXISTS "cancelKey" TEXT');
  } catch { }
}

async function columnExists(tableName, columnName) {
  try {
    const rows = await prisma.$queryRaw`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${tableName} AND column_name = ${columnName} LIMIT 1`;
    return Array.isArray(rows) ? rows.length > 0 : !!rows;
  } catch { return false; }
}

// Create purchase request (lead)
router.post('/', authOptional, async (req, res) => {
  try {
    await ensureTable();
    const { carId, name, email, phone, location, message } = req.body;
    if (!carId || !name || !email || !phone) return res.status(400).json({ error: 'carId, name, email, phone required' });
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) return res.status(404).json({ error: 'Car not found' });
    if (car.saleStatus && car.saleStatus !== 'for_sale') return res.status(409).json({ error: `Car is ${car.saleStatus}` });
    const snapshot = { make: car.make, model: car.model, year: car.year, price: car.price, exShowroomPriceINR: car.exShowroomPriceINR, image: car.image, features: car.features, category: car.category };
    const cancelKey = require('crypto').randomBytes(16).toString('hex');
    let pr;
    try {
      const rows = await prisma.$queryRaw`INSERT INTO "PurchaseRequest" ("carId","userId",name,email,phone,location,message,status,"carSnapshot","cancelKey") VALUES (${car.id}, ${req.userId || null}, ${name}, ${email}, ${phone}, ${location || null}, ${message || null}, 'pending', ${snapshot}, ${cancelKey}) RETURNING *`;
      pr = Array.isArray(rows) ? rows[0] : rows;
    } catch (e) {
      // If cancelKey column missing, add and retry once. Otherwise, fallback without cancelKey column.
      try {
        await prisma.$executeRawUnsafe('ALTER TABLE "PurchaseRequest" ADD COLUMN IF NOT EXISTS "cancelKey" TEXT');
      } catch { }
      try {
        const rows2 = await prisma.$queryRaw`INSERT INTO "PurchaseRequest" ("carId","userId",name,email,phone,location,message,status,"carSnapshot","cancelKey") VALUES (${car.id}, ${req.userId || null}, ${name}, ${email}, ${phone}, ${location || null}, ${message || null}, 'pending', ${snapshot}, ${cancelKey}) RETURNING *`;
        pr = Array.isArray(rows2) ? rows2[0] : rows2;
      } catch (e2) {
        const rows3 = await prisma.$queryRaw`INSERT INTO "PurchaseRequest" ("carId","userId",name,email,phone,location,message,status,"carSnapshot") VALUES (${car.id}, ${req.userId || null}, ${name}, ${email}, ${phone}, ${location || null}, ${message || null}, 'pending', ${snapshot}) RETURNING *`;
        pr = Array.isArray(rows3) ? rows3[0] : rows3;
      }
    }
    // Persist user's contact profile for future auto-fill if authenticated
    if (req.userId) {
      try {
        await prisma.$executeRaw`INSERT INTO "UserContact" ("userId", name, email, phone, location) VALUES (${req.userId}, ${name}, ${email}, ${phone}, ${location || null})
        ON CONFLICT ("userId") DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, location = EXCLUDED.location, "updatedAt" = NOW()`;
      } catch { }
    }
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'PURCHASE_REQUEST_CREATE', targetType: 'CAR', targetId: car.id, metadata: { purchaseRequestId: pr.id } } }); } catch { }
    res.json(pr);
  } catch (e) {
    console.error('PURCHASE_REQUEST_CREATE_ERROR', e);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

// Admin list purchase requests
router.get('/admin/list', auth, adminOnly, async (req, res) => {
  const { status, page = 1, pageSize = 25 } = req.query;
  const p = Math.max(1, parseInt(page));
  const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  try {
    await ensureTable();
    // Make sure optional columns exist to avoid select failures if they are used elsewhere
    try { await prisma.$executeRawUnsafe('ALTER TABLE "PurchaseRequest" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT'); } catch { }
    try { await prisma.$executeRawUnsafe('ALTER TABLE "PurchaseRequest" ADD COLUMN IF NOT EXISTS "cancelKey" TEXT'); } catch { }
    let total = 0; let list = [];
    const baseCols = `id, "carId", "userId", name, email, phone, location, message, status, "createdAt", "updatedAt", "carSnapshot"`;
    const hasCR = await columnExists('PurchaseRequest', 'cancelReason');
    const hasCK = await columnExists('PurchaseRequest', 'cancelKey');
    const cols = baseCols + (hasCR ? ', "cancelReason"' : '') + (hasCK ? ', "cancelKey"' : '');
    if (status) {
      const totalRows = await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM "PurchaseRequest" WHERE status = ${status}`;
      total = (Array.isArray(totalRows) ? totalRows[0]?.c : totalRows?.c) || 0;
      list = await prisma.$queryRawUnsafe(`SELECT ${cols} FROM "PurchaseRequest" WHERE status = $1 ORDER BY "createdAt" DESC OFFSET $2 LIMIT $3`, status, (p - 1) * size, size);
    } else {
      const totalRows = await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM "PurchaseRequest"`;
      total = (Array.isArray(totalRows) ? totalRows[0]?.c : totalRows?.c) || 0;
      list = await prisma.$queryRawUnsafe(`SELECT ${cols} FROM "PurchaseRequest" ORDER BY "createdAt" DESC OFFSET $1 LIMIT $2`, (p - 1) * size, size);
    }
    res.json({ requests: list, page: p, pageSize: size, total, totalPages: Math.ceil(total / size) });
  } catch (e) {
    console.error('PURCHASE_REQUEST_LIST_ERROR', e);
    res.status(500).json({ error: 'Failed to load purchase requests' });
  }
});

// Admin update status
router.patch('/admin/:id/status', auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!['pending', 'contacted', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    await ensureTable();
    const existingRows = await prisma.$queryRaw`SELECT * FROM "PurchaseRequest" WHERE id = ${id}`;
    const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows;
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updatedRows = await prisma.$queryRaw`UPDATE "PurchaseRequest" SET status = ${status}, "updatedAt" = NOW() WHERE id = ${id} RETURNING *`;
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'PURCHASE_REQUEST_STATUS', targetType: 'PURCHASE_REQUEST', targetId: id, metadata: { from: existing.status, to: status } } }); } catch { }
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update' }); }
});

// Admin: mark as sold -> update car to 'sold' and close the request
router.post('/admin/:id/sold', auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw`SELECT * FROM "PurchaseRequest" WHERE id = ${id}`;
    const pr = Array.isArray(rows) ? rows[0] : rows;
    if (!pr) return res.status(404).json({ error: 'Not found' });
    // Update car sale status
    const car = await prisma.car.update({ where: { id: pr.carId }, data: { saleStatus: 'sold' } });
    // Close request
    const updatedRows = await prisma.$queryRaw`UPDATE "PurchaseRequest" SET status = 'closed', "updatedAt" = NOW() WHERE id = ${id} RETURNING *`;
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'PURCHASE_REQUEST_SOLD', targetType: 'PURCHASE_REQUEST', targetId: id, metadata: { carId: pr.carId } } }); } catch { }
    res.json({ request: updated, car });
  } catch (e) { res.status(500).json({ error: 'Failed to mark sold' }); }
});

// User/admin cancel with reason via cancelKey or authenticated owner/admin
router.post('/:id/cancel', authOptional, async (req, res) => {
  const id = req.params.id;
  const { reason, cancelKey } = req.body || {};
  if (!reason) return res.status(400).json({ error: 'reason required' });
  try {
    await ensureTable();
    // Ensure columns exist for cancel
    try { await prisma.$executeRawUnsafe('ALTER TABLE "PurchaseRequest" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT'); } catch { }
    try { await prisma.$executeRawUnsafe('ALTER TABLE "PurchaseRequest" ADD COLUMN IF NOT EXISTS "cancelKey" TEXT'); } catch { }
    const rows = await prisma.$queryRaw`SELECT * FROM "PurchaseRequest" WHERE id = ${id}`;
    const pr = Array.isArray(rows) ? rows[0] : rows;
    if (!pr) return res.status(404).json({ error: 'Not found' });
    // allow if admin, owner, or valid cancelKey
    let allow = false;
    if (req.userId) {
      const u = await prisma.user.findUnique({ where: { id: req.userId } });
      allow = (!!u && (u.role === 'admin' || pr.userId === u.id));
    }
    if (!allow && cancelKey && pr.cancelKey && cancelKey === pr.cancelKey) allow = true;
    if (!allow) return res.status(403).json({ error: 'Forbidden' });
    const updatedRows = await prisma.$queryRaw`UPDATE "PurchaseRequest" SET status = 'closed', "cancelReason" = ${reason}, "updatedAt" = NOW() WHERE id = ${id} RETURNING *`;
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'PURCHASE_REQUEST_CANCEL', targetType: 'PURCHASE_REQUEST', targetId: id, metadata: { reason } } }); } catch { }
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to cancel' }); }
});

// Authenticated user: cancel by carId (latest pending)
router.post('/cancel/by-car/:carId', auth, async (req, res) => {
  const carId = req.params.carId;
  const { reason } = req.body || {};
  if (!reason) return res.status(400).json({ error: 'reason required' });
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw`SELECT * FROM "PurchaseRequest" WHERE "carId" = ${carId} AND "userId" = ${req.userId} AND status = 'pending' ORDER BY "createdAt" DESC LIMIT 1`;
    const pr = Array.isArray(rows) ? rows[0] : rows;
    if (!pr) return res.status(404).json({ error: 'No pending request found' });
    const updatedRows = await prisma.$queryRaw`UPDATE "PurchaseRequest" SET status = 'closed', "cancelReason" = ${reason}, "updatedAt" = NOW() WHERE id = ${pr.id} RETURNING *`;
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'PURCHASE_REQUEST_CANCEL', targetType: 'PURCHASE_REQUEST', targetId: updated.id, metadata: { reason } } }); } catch { }
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to cancel' }); }
});

// Current user's purchase request history
router.get('/me/list', auth, async (req, res) => {
  const { page = 1, pageSize = 50, status } = req.query;
  const p = Math.max(1, parseInt(page));
  const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  try {
    await ensureTable();
    const baseCols = `id, "carId", "userId", name, email, phone, location, message, status, "createdAt", "updatedAt", "carSnapshot"`;
    const hasCR = await columnExists('PurchaseRequest', 'cancelReason');
    const hasCK = await columnExists('PurchaseRequest', 'cancelKey');
    const cols = baseCols + (hasCR ? ', "cancelReason"' : '') + (hasCK ? ', "cancelKey"' : '');
    const whereClause = status ? `AND status = $3` : '';
    const args = status ? [req.userId, (p - 1) * size, status, size] : [req.userId, (p - 1) * size, size];
    const sql = status
      ? `SELECT ${cols} FROM "PurchaseRequest" WHERE "userId" = $1 ${whereClause} ORDER BY "createdAt" DESC OFFSET $2 LIMIT $4`
      : `SELECT ${cols} FROM "PurchaseRequest" WHERE "userId" = $1 ORDER BY "createdAt" DESC OFFSET $2 LIMIT $3`;
    const list = await prisma.$queryRawUnsafe(sql, ...args);
    res.json({ requests: list, page: p, pageSize: size });
  } catch (e) { res.status(500).json({ error: 'Failed to load history' }); }
});

module.exports = router;
