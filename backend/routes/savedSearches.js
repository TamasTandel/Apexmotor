const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function ensureTable() {
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "SavedSearch" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      criteria JSONB NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "lastNotifiedAt" TIMESTAMP
    );`;
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_savedsearch_user_created ON "SavedSearch" ("userId", "createdAt")');
  } catch { }
}

function auth(req, res, next) {
  const h = req.headers.authorization; if (!h) return res.status(401).json({ error: 'Missing auth' });
  try { const p = jwt.verify(h.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET); req.userId = p.userId; next(); } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

router.get('/', auth, async (req, res) => {
  await ensureTable();
  const list = await prisma.savedSearch.findMany({ where: { userId: req.userId }, orderBy: { id: 'desc' } });
  res.json(list);
});

router.post('/', auth, async (req, res) => {
  const { name, criteria } = req.body || {};
  if (!name || !criteria) return res.status(400).json({ error: 'name and criteria required' });
  try {
    await ensureTable();
    const ss = await prisma.savedSearch.create({ data: { userId: req.userId, name, criteria } });
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'SAVED_SEARCH_CREATE', targetType: 'SAVED_SEARCH', targetId: ss.id } }); } catch { }
    res.json(ss);
  } catch (e) { res.status(500).json({ error: 'Failed to save' }); }
});

router.delete('/:id', auth, async (req, res) => {
  const id = req.params.id;
  try {
    await ensureTable();
    const existing = await prisma.savedSearch.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
    await prisma.savedSearch.delete({ where: { id } });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
});

module.exports = router;
