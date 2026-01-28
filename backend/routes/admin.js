const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing auth header' });
  const token = header.replace(/^Bearer\s+/i, '');
  try { const p = jwt.verify(token, process.env.JWT_SECRET); req.userId = p.userId; next(); } catch { return res.status(401).json({ error: 'Invalid token' }); }
}
const ROOT_ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL || 'admin@123.com';
async function adminOnly(req, res, next) {
  const u = await prisma.user.findUnique({ where: { id: req.userId } });
  // Relaxed: any admin role is allowed; keep ROOT_ADMIN_EMAIL note for compatibility
  if (!u || u.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.get('/audit', auth, adminOnly, async (req, res) => {
  const { page = 1, pageSize = 50, action, actorId, targetType } = req.query;
  const p = Math.max(1, parseInt(page));
  const size = Math.min(200, Math.max(1, parseInt(pageSize)));
  const where = {};
  if (action) where.action = action;
  if (actorId) where.actorId = parseInt(actorId);
  if (targetType) where.targetType = targetType;
  try {
    const total = await prisma.auditLog.count({ where });
    const logs = await prisma.auditLog.findMany({ where, orderBy: { id: 'desc' }, skip: (p - 1) * size, take: size });
    res.json({ logs, page: p, pageSize: size, total, totalPages: Math.ceil(total / size) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

router.get('/notifications', auth, adminOnly, async (req, res) => {
  const { status, type, from, to, page = 1, pageSize = 50 } = req.query;
  const p = Math.max(1, parseInt(page));
  const size = Math.min(200, Math.max(1, parseInt(pageSize)));
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  try {
    const total = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({ where, orderBy: { id: 'desc' }, skip: (p - 1) * size, take: size });
    res.json({ notifications, page: p, pageSize: size, total, totalPages: Math.ceil(total / size) });
  } catch (e) { res.status(500).json({ error: 'Failed notifications fetch' }); }
});

// Admin: list Contact Leads (from public Contact Us panel)
router.get('/contact-leads', auth, adminOnly, async (req, res) => {
  const { status, q, from, to } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1'));
  const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || '50')));
  const where = {};
  if (status) where.status = String(status);
  if (q) {
    const term = String(q);
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
    ];
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(String(from));
    if (to) where.createdAt.lte = new Date(String(to));
  }
  try {
    if (!prisma.contactLead || typeof prisma.contactLead.findMany !== 'function') throw new Error('ContactLead model not available');
    const total = await prisma.contactLead.count({ where });
    const leads = await prisma.contactLead.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * pageSize, take: pageSize });
    res.json({ leads, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    // Fallback to raw SQL
    try {
      // Parameterized dynamic WHERE to support filters safely
      let whereSql = 'WHERE 1=1';
      const params = [];
      const add = (val) => { params.push(val); return `$${params.length}`; };
      if (status) whereSql += ` AND status = ${add(String(status))}`;
      if (q) {
        const like = `%${String(q)}%`;
        const p1 = add(like), p2 = add(like), p3 = add(like);
        whereSql += ` AND (name ILIKE ${p1} OR email ILIKE ${p2} OR phone ILIKE ${p3})`;
      }
      if (from) whereSql += ` AND "createdAt" >= ${add(new Date(String(from)))}`;
      if (to) whereSql += ` AND "createdAt" <= ${add(new Date(String(to)))}`;

      const countSql = `SELECT COUNT(*)::int AS c FROM "ContactLead" ${whereSql}`;
      const totalRows = await prisma.$queryRawUnsafe(countSql, ...params);
      const total = Array.isArray(totalRows) ? (totalRows[0]?.c || 0) : (totalRows?.c || 0);

      const offset = (page - 1) * pageSize;
      const listSql = `SELECT id, name, email, phone, message, status, "createdAt" FROM "ContactLead" ${whereSql} ORDER BY id DESC OFFSET $${params.length+1} LIMIT $${params.length+2}`;
      const leads = await prisma.$queryRawUnsafe(listSql, ...params, offset, pageSize);
      res.json({ leads: Array.isArray(leads)? leads : [], page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (rawErr) {
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  }
});

// Admin: update Contact Lead status
router.patch('/contact-leads/:id', auth, adminOnly, async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body || {};
  if (!id || !status) return res.status(400).json({ error: 'id and status required' });
  const allowed = new Set(['new', 'contacted', 'closed']);
  if (!allowed.has(String(status))) return res.status(400).json({ error: 'Invalid status' });
  try {
    let updated;
    // Fetch old status
    let oldStatus = null;
    try {
      if (prisma.contactLead && typeof prisma.contactLead.findUnique === 'function') {
        const cur = await prisma.contactLead.findUnique({ where: { id } });
        oldStatus = cur?.status || null;
      } else {
        const rows = await prisma.$queryRaw`SELECT status FROM "ContactLead" WHERE id = ${id}`;
        oldStatus = (Array.isArray(rows)? rows[0]: rows)?.status || null;
      }
    } catch {}
    if (prisma.contactLead && typeof prisma.contactLead.update === 'function') {
      updated = await prisma.contactLead.update({ where: { id }, data: { status: String(status) } });
    } else {
      const rows = await prisma.$queryRaw`UPDATE "ContactLead" SET status = ${String(status)} WHERE id = ${id} RETURNING id, name, email, phone, message, status, "createdAt"`;
      updated = Array.isArray(rows)? rows[0]: rows;
    }
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'CONTACT_LEAD_STATUS', targetType: 'CONTACT_LEAD', targetId: id, metadata: { status } } }); } catch {}
    try { await ensureContactLeadHistoryTable(); await prisma.$queryRaw`INSERT INTO "ContactLeadHistory" ("leadId", type, "oldValue", "newValue", "actorId") VALUES (${id}, 'status', ${oldStatus}, ${String(status)}, ${req.userId})`; } catch {}
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update' }); }
});

// Helpers for Contact Lead filters reused in export and details
function buildLeadWhere({ status, q, from, to }){
  const where = {};
  if (status) where.status = String(status);
  if (q) {
    const term = String(q);
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
    ];
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(String(from));
    if (to) where.createdAt.lte = new Date(String(to));
  }
  return where;
}

// Admin: export Contact Leads as CSV (applies filters)
router.get('/contact-leads/export', auth, adminOnly, async (req, res) => {
  const where = buildLeadWhere(req.query || {});
  try {
    let leads;
    if (prisma.contactLead && typeof prisma.contactLead.findMany === 'function') {
      leads = await prisma.contactLead.findMany({ where, orderBy: { id: 'desc' }, take: 5000 });
    } else {
      // Fallback limited to last 5000 without filters
      leads = await prisma.$queryRaw`SELECT id, name, email, phone, message, status, "createdAt" FROM "ContactLead" ORDER BY id DESC LIMIT 5000`;
    }
    const rows = Array.isArray(leads) ? leads : [];
    const header = ['id','name','email','phone','message','status','createdAt'];
    const esc = (v)=>{
      if (v == null) return '';
      const s = String(v).replace(/"/g,'""');
      return `"${s.replace(/\r?\n/g,' ')}` + '"';
    };
    const csv = [header.join(',')].concat(rows.map(r=> [r.id, r.name, r.email, r.phone, r.message, r.status, new Date(r.createdAt).toISOString()].map(esc).join(','))).join('\n');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="contact-leads.csv"');
    res.status(200).send(csv);
  } catch (e) { res.status(500).json({ error:'Failed to export' }); }
});

// Admin: Contact Lead details
router.get('/contact-leads/:id', auth, adminOnly, async (req,res)=>{
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error:'Invalid id' });
  try {
    let lead;
    if (prisma.contactLead && typeof prisma.contactLead.findUnique === 'function') {
      lead = await prisma.contactLead.findUnique({ where:{ id } });
    } else {
      const rows = await prisma.$queryRaw`SELECT id, name, email, phone, message, status, "createdAt" FROM "ContactLead" WHERE id = ${id}`;
      lead = Array.isArray(rows)? rows[0]: rows;
    }
    if (!lead) return res.status(404).json({ error:'Not found' });
    res.json(lead);
  } catch { res.status(500).json({ error:'Failed to fetch' }); }
});

// Notes support for Contact Leads (raw SQL side table)
async function ensureContactLeadNotesTable(){
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "ContactLeadNote" (
      id SERIAL PRIMARY KEY,
      "leadId" INT NOT NULL,
      note TEXT NOT NULL,
      "authorId" INT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`;
  } catch {}
}

router.get('/contact-leads/:id/notes', auth, adminOnly, async (req,res)=>{
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error:'Invalid id' });
  try {
    await ensureContactLeadNotesTable();
    const notes = await prisma.$queryRaw`SELECT id, "leadId", note, "authorId", "createdAt" FROM "ContactLeadNote" WHERE "leadId" = ${id} ORDER BY id DESC`;
    res.json({ notes: Array.isArray(notes)? notes : [] });
  } catch { res.status(500).json({ error:'Failed to load notes' }); }
});

router.post('/contact-leads/:id/notes', auth, adminOnly, async (req,res)=>{
  const id = parseInt(req.params.id);
  const { note } = req.body || {};
  if (!id || !note || !String(note).trim()) return res.status(400).json({ error:'Note required' });
  try {
    await ensureContactLeadNotesTable();
    const rows = await prisma.$queryRaw`INSERT INTO "ContactLeadNote" ("leadId", note, "authorId") VALUES (${id}, ${String(note)}, ${req.userId}) RETURNING id, "leadId", note, "authorId", "createdAt"`;
    try { await prisma.auditLog.create({ data:{ actorId: req.userId, action:'CONTACT_LEAD_NOTE', targetType:'CONTACT_LEAD', targetId:id } }); } catch {}
    const created = Array.isArray(rows)? rows[0]: rows;
    res.json(created);
  } catch { res.status(500).json({ error:'Failed to add note' }); }
});

// ---- Contact Lead Assignment & History ----
async function ensureContactLeadHistoryTable(){
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "ContactLeadHistory" (
      id SERIAL PRIMARY KEY,
      "leadId" INT NOT NULL,
      type TEXT NOT NULL, -- status | assign
      "oldValue" TEXT,
      "newValue" TEXT,
      "actorId" INT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`;
  } catch {}
}

async function ensureContactLeadAssignmentTable(){
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "ContactLeadAssignment" (
      id SERIAL PRIMARY KEY,
      "leadId" INT NOT NULL,
      "userId" INT NOT NULL,
      "assignedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`;
  } catch {}
}

// Assign lead to an agent (userId)
router.post('/contact-leads/:id/assign', auth, adminOnly, async (req,res)=>{
  const id = parseInt(req.params.id);
  const { userId } = req.body || {};
  if (!id || !userId) return res.status(400).json({ error:'id and userId required' });
  try {
    await ensureContactLeadAssignmentTable();
    await ensureContactLeadHistoryTable();
    // Write assignment record
    const rows = await prisma.$queryRaw`INSERT INTO "ContactLeadAssignment" ("leadId", "userId") VALUES (${id}, ${parseInt(userId)}) RETURNING id, "leadId", "userId", "assignedAt"`;
    await prisma.$queryRaw`INSERT INTO "ContactLeadHistory" ("leadId", type, "oldValue", "newValue", "actorId") VALUES (${id}, 'assign', NULL, ${String(userId)}, ${req.userId})`;
    try { await prisma.auditLog.create({ data:{ actorId: req.userId, action:'CONTACT_LEAD_ASSIGN', targetType:'CONTACT_LEAD', targetId:id, metadata:{ userId: parseInt(userId) } } }); } catch {}
    res.json(Array.isArray(rows)? rows[0]: rows);
  } catch (e) { res.status(500).json({ error:'Failed to assign' }); }
});

// Delete a lead (and cascade related notes/history/assignment records)
router.delete('/contact-leads/:id', auth, adminOnly, async (req,res)=>{
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error:'Invalid id' });
  try {
    await ensureContactLeadNotesTable();
    await ensureContactLeadHistoryTable();
    await ensureContactLeadAssignmentTable();
    await prisma.$executeRaw`DELETE FROM "ContactLeadNote" WHERE "leadId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "ContactLeadHistory" WHERE "leadId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "ContactLeadAssignment" WHERE "leadId" = ${id}`;
    if (prisma.contactLead && typeof prisma.contactLead.delete === 'function') {
      await prisma.contactLead.delete({ where:{ id } });
    } else {
      await prisma.$executeRaw`DELETE FROM "ContactLead" WHERE id = ${id}`;
    }
    try { await prisma.auditLog.create({ data:{ actorId: req.userId, action:'CONTACT_LEAD_DELETE', targetType:'CONTACT_LEAD', targetId:id } }); } catch {}
    res.json({ ok:true });
  } catch { res.status(500).json({ error:'Failed to delete' }); }
});

// Combined timeline: status changes + assignments + notes
router.get('/contact-leads/:id/timeline', auth, adminOnly, async (req,res)=>{
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error:'Invalid id' });
  try {
    await ensureContactLeadNotesTable();
    await ensureContactLeadHistoryTable();
    const notes = await prisma.$queryRaw`SELECT id, 'note'::text AS kind, note AS description, "authorId", "createdAt" FROM "ContactLeadNote" WHERE "leadId" = ${id}`;
    const hist = await prisma.$queryRaw`SELECT id, type AS kind, CONCAT(type,' change: ', COALESCE("oldValue",''),' -> ', COALESCE("newValue",'')) AS description, "actorId", "createdAt" FROM "ContactLeadHistory" WHERE "leadId" = ${id}`;
    const all = [...(Array.isArray(notes)?notes:[]), ...(Array.isArray(hist)?hist:[])].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ items: all });
  } catch { res.status(500).json({ error:'Failed timeline' }); }
});

// Hook status updates into history
// Wrap existing status route by inserting a history row when status changes
// (Already handled in route.patch above; we augment it here by reading previous and inserting into ContactLeadHistory.)

// Admin: list saved searches
router.get('/saved-searches', auth, adminOnly, async (req,res)=>{
  const { userId, page=1, pageSize=50 } = req.query;
  const where = {}; if (userId) where.userId = parseInt(userId);
  const p = Math.max(1, parseInt(page)); const size = Math.min(200, Math.max(1, parseInt(pageSize)));
  const total = await prisma.savedSearch.count({ where });
  const list = await prisma.savedSearch.findMany({ where, orderBy:{ id:'desc' }, skip:(p-1)*size, take:size });
  res.json({ searches:list, page:p, pageSize:size, total, totalPages: Math.ceil(total/size) });
});

router.get('/metrics/timeseries', auth, adminOnly, async (req,res)=>{
  const days = Math.min(90, Math.max(1, parseInt(req.query.days||'30')));
  const start = new Date(Date.now() - (days-1)*24*60*60*1000);
  function bucketize(records){
    const map = new Map();
    for(const r of records){
      const d = new Date(r.createdAt); d.setHours(0,0,0,0); const key = d.toISOString().slice(0,10);
      map.set(key, (map.get(key)||0)+1);
    }
    return map;
  }
  try {
    const [cars, users, bookings, finance] = await Promise.all([
      prisma.car.findMany({ where:{ createdAt:{ gte: start } }, select:{ createdAt:true } }),
      prisma.user.findMany({ where:{ createdAt:{ gte: start } }, select:{ createdAt:true } }),
      prisma.serviceBooking.findMany({ where:{ createdAt:{ gte: start } }, select:{ createdAt:true } }),
      prisma.financeApplication.findMany({ where:{ createdAt:{ gte: start } }, select:{ createdAt:true } })
    ]);
    const labels = [];
    for(let i=0;i<days;i++){ const d = new Date(start.getTime()+ i*24*60*60*1000); labels.push(d.toISOString().slice(0,10)); }
    const carMap = bucketize(cars), userMap = bucketize(users), bookMap = bucketize(bookings), finMap = bucketize(finance);
    res.json({ labels, cars: labels.map(k=>carMap.get(k)||0), users: labels.map(k=>userMap.get(k)||0), serviceBookings: labels.map(k=>bookMap.get(k)||0), financeApplications: labels.map(k=>finMap.get(k)||0) });
  } catch { res.status(500).json({ error:'Failed timeseries' }); }
});

router.post('/notifications/:id/resend', auth, adminOnly, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.notification.update({ where: { id }, data: { status: 'pending', sentAt: null } });
    await prisma.auditLog.create({ data: { actorId: req.userId, action: 'NOTIFICATION_RESEND', targetType: 'NOTIFICATION', targetId: id } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to resend' });
  }
});

module.exports = router;

// Lightweight agents list for assignments (admins + mechanics)
router.get('/agents', auth, adminOnly, async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: { in: ['admin', 'mechanic'] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { id: 'asc' }
    });
    res.json({ agents });
  } catch {
    res.status(500).json({ error: 'Failed to load agents' });
  }
});

// Below: additional CSV exports for admin modules
// Finance Applications export
router.get('/finance/export', auth, adminOnly, async (req, res) => {
  try {
    const rows = await prisma.financeApplication.findMany({ orderBy: { id: 'desc' }, take: 10000 });
    const header = ['id','userId','amount','status','createdAt'];
    const esc = (v)=> v==null? '': `"${String(v).replace(/"/g,'""')}"`;
    const csv = [header.join(',')].concat(rows.map(r=> [r.id,r.userId,r.amount,r.status,new Date(r.createdAt).toISOString()].map(esc).join(','))).join('\n');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="finance-applications.csv"');
    res.status(200).send(csv);
  } catch { res.status(500).json({ error:'Failed to export' }); }
});

// Service Bookings export
router.get('/service/export', auth, adminOnly, async (req, res) => {
  try {
    const rows = await prisma.serviceBooking.findMany({ orderBy: { id: 'desc' }, take: 10000 });
    const header = ['id','userId','carId','service','date','status','locationId','estimatedCost','createdAt'];
    const esc = (v)=> v==null? '': `"${String(v).replace(/"/g,'""')}"`;
    const csv = [header.join(',')].concat(rows.map(r=> [r.id,r.userId,r.carId,r.service,r.date?.toISOString(),r.status,r.locationId,r.estimatedCost,r.createdAt?.toISOString()].map(esc).join(','))).join('\n');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="service-bookings.csv"');
    res.status(200).send(csv);
  } catch { res.status(500).json({ error:'Failed to export' }); }
});

// Purchase Requests export
router.get('/purchases/export', auth, adminOnly, async (req, res) => {
  try {
    const rows = await prisma.purchaseRequest.findMany({ orderBy: { id: 'desc' }, take: 10000 });
    const header = ['id','carId','userId','name','email','phone','location','status','createdAt'];
    const esc = (v)=> v==null? '': `"${String(v).replace(/"/g,'""')}"`;
    const csv = [header.join(',')].concat(rows.map(r=> [r.id,r.carId,r.userId,r.name,r.email,r.phone,r.location,r.status,r.createdAt?.toISOString()].map(esc).join(','))).join('\n');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="purchase-requests.csv"');
    res.status(200).send(csv);
  } catch { res.status(500).json({ error:'Failed to export' }); }
});
