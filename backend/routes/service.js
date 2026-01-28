const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const crypto = require('crypto');
const stripe = process.env.STRIPE_SECRET ? new Stripe(process.env.STRIPE_SECRET) : null;

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing auth header' });
  const token = header.replace(/^Bearer\s+/i, '');
  try { const p = jwt.verify(token, process.env.JWT_SECRET); req.userId = p.userId; next(); } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

async function adminOnly(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Utility to parse date (yyyy-mm-dd)
function parseDay(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null; return d;
}

// GET available slots for a date (duration 60m) optionally locationId
router.get('/availability', auth, async (req, res) => {
  const { date, locationId } = req.query;
  if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' });
  const day = parseDay(date);
  if (!day) return res.status(400).json({ error: 'invalid date' });
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(day); end.setHours(23, 59, 59, 999);
  const where = { slotStart: { gte: start, lt: end } };
  if (locationId) where.locationId = locationId;
  const bookings = await prisma.serviceBooking.findMany({ where, select: { slotStart: true, slotEnd: true, locationId: true } });
  // Working hours 09:00 - 17:00 (8 slots if 60m)
  const slots = [];
  for (let h = 9; h < 17; h++) {
    const s = new Date(day); s.setHours(h, 0, 0, 0);
    const e = new Date(s.getTime() + 60 * 60000);
    const overlapping = bookings.filter(b => b.slotStart && b.slotEnd && b.slotStart < e && b.slotEnd > s);
    // capacity from location or default 3
    let capacity = 3;
    if (locationId) {
      const loc = await prisma.location.findUnique({ where: { id: locationId } });
      if (loc) capacity = loc.capacityPerSlot;
    }
    slots.push({ time: `${String(h).padStart(2, '0')}:00`, start: s, end: e, booked: overlapping.length, capacity, available: overlapping.length < capacity });
  }
  res.json({ date, slots });
});

// Basic input validation helper
function validate(fields, body) {
  for (const f of fields) {
    if (body[f] == null || body[f] === '') return `Missing field: ${f}`;
  }
  return null;
}

// Book a service
router.post('/', auth, async (req, res) => {
  try {
    // custom validation: require service & date plus (carId OR customCar)
    if (!req.body.service || !req.body.date) return res.status(400).json({ error: 'Missing field: service/date' });
    if (!req.body.carId && !req.body.customCar) return res.status(400).json({ error: 'carId or customCar required' });
    const { carId, service, date, serviceType, preferredTime, notes, contactPhone, durationMinutes = 60, address, customCar } = req.body;
    // derive slot times if preferredTime provided (format HH:MM)
    let slotStart = null; let slotEnd = null;
    const day = new Date(date);
    if (preferredTime) {
      const [hh, mm] = preferredTime.split(':');
      if (!isNaN(hh) && !isNaN(mm)) {
        slotStart = new Date(day);
        slotStart.setHours(parseInt(hh), parseInt(mm), 0, 0);
        slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
      }
    }
    // conflict check (capacity = 3 overlapping bookings per slot window)
    if (slotStart && slotEnd) {
      const overlapCount = await prisma.serviceBooking.count({ where: { slotStart: { lt: slotEnd }, slotEnd: { gt: slotStart }, locationId: req.body.locationId || undefined } });
      // derive capacity per location if location provided
      let CAPACITY = 3;
      if (req.body.locationId) {
        const loc = await prisma.location.findUnique({ where: { id: req.body.locationId } });
        if (loc) CAPACITY = loc.capacityPerSlot;
      }
      if (overlapCount >= CAPACITY) return res.status(409).json({ error: 'Time slot full, choose another time' });
    }
    // Create first, then derive bookingCode from actual id to avoid race / stale client issues
    // Use relation connect for user to support schema versions requiring explicit user relation
    const createData = { user: { connect: { id: req.userId } }, service, date: new Date(date), status: 'pending', serviceType, preferredTime, notes, contactPhone, durationMinutes, slotStart, slotEnd, locationId: req.body.locationId || undefined, estimatedCost: req.body.estimatedCost, address, customCar };
    if (carId) {
      createData.carId = carId;
    } else {
      // ensure no residual undefined/null key triggers older client validation
      if (createData.carId === undefined) delete createData.carId;
    }
    let booking = await prisma.serviceBooking.create({ data: createData });
    // Generate cryptographically random, longer, mixed booking code (public lookup key)
    async function generateUniqueCode() {
      for (let i = 0; i < 5; i++) { // few attempts
        const raw = crypto.randomBytes(9).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const code = 'SV-' + raw.slice(0, 4) + '-' + raw.slice(4, 8) + '-' + raw.slice(8, 12);
        const existing = await prisma.serviceBooking.findUnique({ where: { bookingCode: code } });
        if (!existing) return code;
      }
      // fallback to id based suffix if collisions persist
      return 'SV-' + String(booking.id).padStart(2, '0') + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    const bookingCode = await generateUniqueCode();
    booking = await prisma.serviceBooking.update({ where: { id: booking.id }, data: { bookingCode } });
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'SERVICE_BOOKING_CREATE', targetType: 'BOOKING', targetId: booking.id, metadata: { service: booking.service } } }); } catch { }
    // enqueue notification placeholder
    await prisma.notification.create({ data: { userId: req.userId, bookingId: booking.id, type: 'booking_confirmation', payload: { service: booking.service, date: booking.date } } });
    res.json(booking);
  } catch (e) {
    console.error('SERVICE_BOOKING_CREATE_ERROR', e);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to create booking' : (e?.message || 'Failed to create booking');
    res.status(500).json({ error: msg });
  }
});

// Public booking status lookup by code (returns sanitized fields only)
router.get('/code/:code', async (req, res) => {
  const code = req.params.code.trim();
  if (!code) return res.status(400).json({ error: 'Code required' });
  const booking = await prisma.serviceBooking.findUnique({ where: { bookingCode: code } });
  if (!booking) return res.status(404).json({ error: 'Not found' });
  const { bookingCode, status, service, serviceType, date, updatedAt, createdAt } = booking;
  res.json({ bookingCode, status, service, serviceType, date, updatedAt, createdAt });
});

// Get user's service bookings (moved off root param to avoid /admin/* conflicts)
router.get('/user/:userId', auth, async (req, res) => {
  const userId = req.params.userId;
  if (userId !== req.userId) {
    // allow admin
    const u = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!u || u.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  }
  const bookings = await prisma.serviceBooking.findMany({ where: { userId }, orderBy: { date: 'asc' } });
  res.json(bookings);
});

// Update booking status or details
router.patch('/:id', auth, async (req, res) => {
  const id = req.params.id;
  try {
    // ownership or admin
    const existing = await prisma.serviceBooking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });
    if (existing.userId !== req.userId) {
      const u = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!u || u.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    }
    const data = { ...req.body };
    // Remove client-provided timing fields for automation
    delete data.dropOffAt; delete data.pickUpAt; delete data.completedAt; delete data.historyNote;
    // Clean empty string fields so they don't overwrite with ''
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
    // Parse numeric
    if (data.finalCost != null) { const fc = parseFloat(data.finalCost); if (!isNaN(fc)) data.finalCost = fc; else delete data.finalCost; }
    if (data.estimatedCost != null) { const ec = parseFloat(data.estimatedCost); if (!isNaN(ec)) data.estimatedCost = ec; else delete data.estimatedCost; }
    // Guard: status workflow: pending -> confirmed -> completed; any -> cancelled
    if (data.status) {
      const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!allowed.includes(data.status)) return res.status(400).json({ error: 'Invalid status' });
      const from = existing.status;
      const to = data.status;
      if (to !== from) {
        const valid = (
          (from === 'pending' && (to === 'confirmed' || to === 'cancelled')) ||
          (from === 'confirmed' && (to === 'completed' || to === 'cancelled')) ||
          (from === 'completed' && to === 'completed') ||
          // allow reverting nothing else
          (to === 'cancelled')
        );
        if (!valid) return res.status(409).json({ error: `Illegal transition ${from} -> ${to}` });
        if (to === 'confirmed') {
          // auto timestamp for confirmation (ready estimate)
          data.pickUpAt = new Date();
        }
        if (to === 'completed') {
          data.completedAt = new Date();
        }
        if (to === 'cancelled') {
          if (!data.cancelReason) return res.status(400).json({ error: 'cancelReason required when cancelling' });
        }
      } else {
        // Same status edit: don't enforce transition-specific requirements
        // No-op for automated fields when status unchanged
        // If status unchanged and no new cancelReason provided, leave as-is
        if (to === 'cancelled' && !data.cancelReason) delete data.cancelReason; // avoid overwriting existing with undefined
      }
    }
    // Automated timestamps already set above; ignore manual input
    if (data.date) data.date = new Date(data.date);
    if (data.preferredTime || data.durationMinutes) {
      const duration = data.durationMinutes || existing.durationMinutes || 60;
      const baseDate = new Date(data.date || existing.date);
      const pref = data.preferredTime || existing.preferredTime;
      if (pref) {
        const [hh, mm] = pref.split(':');
        if (!isNaN(hh) && !isNaN(mm)) {
          const slotStart = new Date(baseDate); slotStart.setHours(parseInt(hh), parseInt(mm), 0, 0);
          const slotEnd = new Date(slotStart.getTime() + duration * 60000);
          data.slotStart = slotStart; data.slotEnd = slotEnd; data.durationMinutes = duration;
        }
      }
    }
    const booking = await prisma.serviceBooking.update({ where: { id }, data });
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'SERVICE_BOOKING_UPDATE', targetType: 'BOOKING', targetId: booking.id, metadata: { changed: Object.keys(data) } } }); } catch { }
    const statusChanged = data.status && data.status !== existing.status;
    if (statusChanged) {
      await prisma.notification.create({ data: { userId: existing.userId, bookingId: booking.id, type: 'status_change', payload: { status: data.status } } });
      try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'SERVICE_BOOKING_STATUS_CHANGE', targetType: 'BOOKING', targetId: booking.id, metadata: { from: existing.status, to: data.status } } }); } catch { }
    }
    if (statusChanged || data.cancelReason) {
      try { await prisma.serviceBookingHistory.create({ data: { bookingId: booking.id, fromStatus: statusChanged ? existing.status : existing.status, toStatus: data.status || existing.status, actorId: req.userId, note: data.cancelReason || undefined } }); } catch { }
    }
    res.json(booking);
  } catch (e) {
    console.error('SERVICE_BOOKING_UPDATE_ERROR', e);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Cancel booking
router.delete('/:id', auth, async (req, res) => {
  const id = req.params.id;
  try {
    const existing = await prisma.serviceBooking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });
    if (existing.userId !== req.userId) {
      const u = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!u || u.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    }
    const booking = await prisma.serviceBooking.update({ where: { id }, data: { status: 'cancelled' } });
    try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'SERVICE_BOOKING_CANCEL', targetType: 'BOOKING', targetId: booking.id } }); } catch { }
    await prisma.notification.create({ data: { userId: existing.userId, bookingId: booking.id, type: 'status_change', payload: { status: 'cancelled' } } });
    res.json(booking);
  } catch {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Admin dashboard listing with filters & pagination
router.get('/admin/list', auth, adminOnly, async (req, res) => {
  const { status, from, to, page = 1, pageSize = 25, locationId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (locationId) where.locationId = locationId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  const p = Math.max(1, parseInt(page));
  const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  try {
    const total = await prisma.serviceBooking.count({ where });
    const bookings = await prisma.serviceBooking.findMany({ where, orderBy: { date: 'asc' }, skip: (p - 1) * size, take: size });
    const userIds = [...new Set(bookings.map(b => b.userId))];
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
    const carIds = [...new Set(bookings.filter(b => b.carId).map(b => b.carId))];
    const cars = carIds.length ? await prisma.car.findMany({ where: { id: { in: carIds } }, select: { id: true, make: true, model: true, year: true } }) : [];
    const carMap = Object.fromEntries(cars.map(c => [c.id, c]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    bookings.forEach(b => { b.user = userMap[b.userId]; const c = b.carId ? carMap[b.carId] : null; b.carDisplay = b.customCar || (c ? `${c.make} ${c.model}` : b.carId); });
    console.log('ADMIN_LIST_BOOKINGS', { where, count: bookings.length, total });
    res.json({ bookings, page: p, pageSize: size, total, totalPages: Math.ceil(total / size) });
  } catch (e) {
    console.error('ADMIN_LIST_ERROR', e);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// Admin: detailed booking with history
router.get('/admin/detail/:id', auth, adminOnly, async (req, res) => {
  const id = req.params.id;
  try {
    const booking = await prisma.serviceBooking.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true } }, history: { orderBy: { changedAt: 'asc' } } } });
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Car service history (completed only)
router.get('/car/:carId', auth, async (req, res) => {
  const carId = req.params.carId;
  const history = await prisma.serviceBooking.findMany({ where: { carId, status: 'completed' }, orderBy: { date: 'desc' }, take: 50 });
  res.json(history);
});

// Service recommendations (very simple rules)
router.get('/recommendations/:carId', auth, async (req, res) => {
  const carId = req.params.carId;
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) return res.status(404).json({ error: 'Car not found' });
  const recs = [];
  const now = new Date();
  if (car.odometerKm != null && (car.odometerKm % 10000) < 500) recs.push({ code: 'OIL_CHANGE', label: 'Oil / Filter Change Soon', reason: `Odometer ${car.odometerKm} km` });
  if (car.lastServiceDate) {
    const months = (now - car.lastServiceDate) / (1000 * 60 * 60 * 24 * 30);
    if (months > 12) recs.push({ code: 'ANNUAL_CHECK', label: 'Annual Inspection Due', reason: `Last service ${Math.round(months)} months ago` });
  } else {
    recs.push({ code: 'BASELINE_SERVICE', label: 'Initial Service Recommended', reason: 'No service record date on file' });
  }
  res.json({ carId, recommendations: recs });
});

// Locations CRUD (admin)
router.post('/locations', auth, adminOnly, async (req, res) => {
  const { name, address, capacityPerSlot = 3 } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const loc = await prisma.location.create({ data: { name, address, capacityPerSlot } });
  res.json(loc);
});
router.get('/locations', auth, async (req, res) => {
  const locs = await prisma.location.findMany({ orderBy: { name: 'asc' } });
  res.json(locs);
});
router.patch('/locations/:id', auth, adminOnly, async (req, res) => {
  const id = req.params.id; const data = req.body; delete data.id;
  try { const loc = await prisma.location.update({ where: { id }, data }); res.json(loc); } catch { res.status(404).json({ error: 'Not found' }); }
});
router.delete('/locations/:id', auth, adminOnly, async (req, res) => {
  const id = req.params.id; try { await prisma.location.delete({ where: { id } }); res.json({ ok: true }); } catch { res.status(404).json({ error: 'Not found' }); }
});

// Notification queue fetch (admin) simple
router.get('/notifications/pending', auth, adminOnly, async (req, res) => {
  const list = await prisma.notification.findMany({ where: { status: 'pending' }, take: 100 });
  res.json(list);
});

// iCal export (user future bookings) - public token approach simplified to auth required
router.get('/ical/me', auth, async (req, res) => {
  const upcoming = await prisma.serviceBooking.findMany({ where: { userId: req.userId, date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 200 });
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AutoHub//ServiceBookings//EN'
  ];
  for (const b of upcoming) {
    const dtStart = (b.slotStart || b.date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endBase = b.slotEnd || new Date((b.slotStart || b.date).getTime() + (b.durationMinutes || 60) * 60000);
    const dtEnd = endBase.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:service-${b.id}@autohub`);
    lines.push(`DTSTAMP:${dtStart}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${b.service}`);
    lines.push(`DESCRIPTION:Status ${b.status}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  res.setHeader('Content-Type', 'text/calendar');
  res.send(lines.join('\r\n'));
});

// Payment processing with Stripe
router.post('/pay/:id', auth, async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  const id = req.params.id;
  const booking = await prisma.serviceBooking.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ error: 'Not found' });
  if (booking.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  if (booking.paymentStatus && booking.paymentStatus !== 'unpaid') return res.json({ message: 'Already processed', booking });
  try {
    const amount = Math.round((booking.estimatedCost || 100) * 100); // default 100 USD cents
    const pi = await stripe.paymentIntents.create({ amount, currency: 'usd', metadata: { bookingId: String(booking.id) } });
    const updated = await prisma.serviceBooking.update({ where: { id }, data: { paymentIntentId: pi.id, paymentStatus: 'pending' } });
    res.json({ clientSecret: pi.client_secret, booking: updated });
  } catch (e) { res.status(500).json({ error: 'Stripe error' }); }
});

router.post('/pay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(500).end();
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const bookingId = pi.metadata.bookingId;
      await prisma.serviceBooking.update({ where: { id: bookingId }, data: { paymentStatus: 'paid', amountPaid: pi.amount_received / 100 } });
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const bookingId = pi.metadata.bookingId;
      await prisma.serviceBooking.update({ where: { id: bookingId }, data: { paymentStatus: 'failed' } });
    }
    res.json({ received: true });
  } catch (err) { console.error('Webhook error', err); res.status(400).send('Webhook Error'); }
});

module.exports = router;
