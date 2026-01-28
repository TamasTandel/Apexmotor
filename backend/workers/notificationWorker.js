require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const notifQueue = new Queue('notifications', { connection });
const searchDigestQueue = new Queue('saved-search-digests', { connection });
new QueueScheduler('notifications', { connection });
new QueueScheduler('saved-search-digests', { connection });

// Simple mock sender - extend with real email/SMS integrations.
async function generateReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24*60*60*1000);
  const upcoming = await prisma.serviceBooking.findMany({ where:{ status: { in:['pending','confirmed'] }, OR:[ { slotStart: { gte: now, lte: in24h } }, { AND:[ { slotStart: null }, { date: { gte: now, lte: in24h } } ] } ] }, select:{ id:true, userId:true, slotStart:true, date:true, service:true } });
  for (const b of upcoming) {
    const existing = await prisma.notification.findFirst({ where:{ bookingId: b.id, type:'booking_reminder' } });
    if (!existing) {
      await prisma.notification.create({ data:{ userId: b.userId, bookingId: b.id, type:'booking_reminder', payload:{ service: b.service, at: b.slotStart || b.date } } });
    }
  }
}

async function evaluateSavedSearches() {
  // naive: find saved searches not notified in last 24h, query cars matching criteria and look for new or price dropped
  const since = new Date(Date.now() - 24*60*60*1000);
  const searches = await prisma.savedSearch.findMany({ where:{ OR:[ { lastNotifiedAt: null }, { lastNotifiedAt: { lt: since } } ] }, take: 100 });
  for (const ss of searches) {
    const crit = ss.criteria || {};
    const where = {};
    if (crit.make) where.make = { contains: crit.make, mode:'insensitive' };
    if (crit.bodyType) where.bodyType = Array.isArray(crit.bodyType)? { in: crit.bodyType } : { equals: crit.bodyType };
    if (crit.category) where.category = { contains: crit.category, mode:'insensitive' };
    if (crit.minPrice || crit.maxPrice) { where.price = {}; if (crit.minPrice) where.price.gte = parseFloat(crit.minPrice); if (crit.maxPrice) where.price.lte = parseFloat(crit.maxPrice); }
    if (crit.region) where.region = { equals: crit.region };
    where.saleStatus = { equals: 'for_sale' };
    const cars = await prisma.car.findMany({ where, orderBy:{ updatedAt:'desc' }, take: 20 });
    if (cars.length) {
      await prisma.notification.create({ data:{ userId: ss.userId, type:'saved_search_update', payload:{ savedSearchId: ss.id, count: cars.length, sample: cars.slice(0,5).map(c=>({ id:c.id, make:c.make, model:c.model, price:c.price })) } } });
      await prisma.savedSearch.update({ where:{ id: ss.id }, data:{ lastNotifiedAt: new Date() } });
    } else {
      await prisma.savedSearch.update({ where:{ id: ss.id }, data:{ lastNotifiedAt: new Date() } });
    }
  }
}

async function processNotifications(batchSize = 20) {
  await generateReminders();
  const now = Date.now();
  const candidates = await prisma.notification.findMany({
    where: { status: { in: ['pending','failed'] }, attemptCount: { lt: 5 } },
    take: batchSize * 3,
    orderBy: { createdAt: 'asc' }
  });
  const work = candidates.filter(n => {
    const delay = Math.pow(n.attemptCount || 0, 2) * 30000;
    const eligibleAt = new Date(n.createdAt).getTime() + delay;
    return eligibleAt <= now;
  }).slice(0, batchSize);
  for (const n of work) {
    try {
      console.log(`Sending notification ${n.id} (attempt ${n.attemptCount+1}) to user ${n.userId}: ${n.type}`);
      await prisma.notification.update({ where:{ id: n.id }, data:{ status:'sent', sentAt: new Date(), attemptCount: { increment: 1 }, error: null } });
    } catch (err) {
      console.error('Notification send failed', n.id, err);
      await prisma.notification.update({ where:{ id: n.id }, data:{ status:'failed', attemptCount: { increment: 1 }, error: err.message } });
    }
  }
}

// Enqueue periodic jobs
async function scheduleRecurring(){
  await searchDigestQueue.add('daily', {}, { repeat: { cron: '*/10 * * * *' } }); // demo: every 10 minutes
  await notifQueue.add('tick', {}, { repeat: { every: 5000 } }); // every 5s
}

// Workers
new Worker('saved-search-digests', async () => {
  try { await evaluateSavedSearches(); } catch (e) { console.error('evaluateSavedSearches error', e); }
}, { connection });

new Worker('notifications', async () => {
  await processNotifications();
}, { connection });

scheduleRecurring().catch(e=>console.error('scheduleRecurring error', e));
