const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Auth middleware (mirrors style in other route files)
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing auth header' });
  const token = header.replace(/^Bearer\s+/i, '');
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = p.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function adminOnly(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Submit finance application (user only; userId derived from token)
router.post('/', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount == null || isNaN(parseFloat(amount))) return res.status(400).json({ error: 'Valid amount required' });
    const app = await prisma.financeApplication.create({
      data: { userId: req.userId, amount: parseFloat(amount), status: 'pending' }
    });
    res.json(app);
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get current user's finance applications
router.get('/me', auth, async (req, res) => {
  const apps = await prisma.financeApplication.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
  res.json(apps);
});

// Admin list with basic filters/pagination (foundation for review UI)
router.get('/admin/list', auth, adminOnly, async (req, res) => {
  const { status, page = 1, pageSize = 25 } = req.query;
  const where = {};
  if (status) where.status = status;
  const p = Math.max(1, parseInt(page));
  const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  const total = await prisma.financeApplication.count({ where });
  const apps = await prisma.financeApplication.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (p - 1) * size, take: size });
  res.json({ applications: apps, page: p, pageSize: size, total, totalPages: Math.ceil(total / size) });
});

// Admin update (approve / reject) - lightweight (will extend with audit log later)
router.patch('/admin/:id', auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  try {
    const { status } = req.body; // expected values: approved | rejected | pending
    if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const existing = await prisma.financeApplication.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.financeApplication.update({ where: { id }, data: { status } });
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'FINANCE_STATUS_CHANGE', targetType: 'FINANCE', targetId: id, metadata: { from: existing.status, to: status } } }); } catch { }
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;

// EMI calculator (public): amount (principal), rate (annual %, default 10), tenure (months, default 60)
router.get('/emi', async (req, res) => {
  const P = parseFloat(req.query.amount || '0');
  const annual = parseFloat(req.query.rate || '10');
  const n = parseInt(req.query.tenure || '60');
  if (!(P > 0) || !(n > 0)) return res.status(400).json({ error: 'Valid amount and tenure required' });
  const r = (annual / 12) / 100;
  const emi = r === 0 ? (P / n) : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - P;
  res.json({ amount: P, annualRate: annual, tenureMonths: n, emi: Number(emi.toFixed(2)), interest: Number(interest.toFixed(2)), total: Number(total.toFixed(2)) });
});
