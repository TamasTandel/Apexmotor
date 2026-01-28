const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureTable(){
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "ContactLead" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );`;
  } catch {}
}

// Public: submit contact us lead
router.post('/', async (req,res)=>{
  const { name, email, phone, message } = req.body || {};
  if (!name || !email) return res.status(400).json({ error:'name and email required' });
  try {
    await ensureTable();
    let lead;
    try {
      // Preferred: use Prisma model if generated
      if (!prisma.contactLead || typeof prisma.contactLead.create !== 'function') throw new Error('Prisma model ContactLead not available');
      lead = await prisma.contactLead.create({ data:{ name, email, phone, message } });
    } catch (e) {
      // Fallback: raw SQL insert
      try {
        const rows = await prisma.$queryRaw`INSERT INTO "ContactLead" (name, email, phone, message) VALUES (${name}, ${email}, ${phone||null}, ${message||null}) RETURNING id`;
        const r = Array.isArray(rows)? rows[0]: rows; lead = { id: r?.id };
      } catch (rawErr) {
        req.log?.error({ err: rawErr }, 'Contact lead insert failed');
        throw rawErr;
      }
    }
    try { await prisma.auditLog.create({ data:{ actorId: null, action:'CONTACT_LEAD_CREATE', targetType:'CONTACT_LEAD', targetId: lead.id } }); } catch {}
    // enqueue a notification for admin inbox
    try { await prisma.notification.create({ data:{ userId: 1, type:'contact_lead', payload:{ leadId: lead.id, name, email } } }); } catch {}
    res.json({ ok:true });
  } catch (e) { req.log?.error({ err: e }, 'Contact submit failed'); res.status(500).json({ error:'Failed to submit' }); }
});

module.exports = router;
