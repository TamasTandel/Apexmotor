const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const { PrismaClient } = require('@prisma/client');
const carsRoutes = require('./routes/cars');
const usersRoutes = require('./routes/users');
const financeRoutes = require('./routes/finance');
const serviceRoutes = require('./routes/service');
const adminRoutes = require('./routes/admin');
const buyRoutes = require('./routes/buy');
const contactRoutes = require('./routes/contact');
const savedSearchRoutes = require('./routes/savedSearches');
const testDriveRoutes = require('./routes/testdrive');

const app = express();
// Logging & security (enable HTTP logs only in production or when LOG_HTTP=1)
const enableHttpLogging = process.env.LOG_HTTP === '1' || process.env.NODE_ENV === 'production';
if (enableHttpLogging) {
	app.use(pinoHttp({ quietReqLogger: true }));
}
app.use(helmet());
const prisma = new PrismaClient();

app.use(cors());
// Support JSON and HTML form submissions
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});
// Basic rate limit for all routes (configurable via env)
app.use(rateLimit({ windowMs: parseInt(process.env.RATE_WINDOW_MS || '60000'), max: parseInt(process.env.RATE_MAX || '120') }));

app.use('/api/cars', carsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/admin', adminRoutes); // audit logs, notifications
app.use('/api/buy', buyRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/testdrive', testDriveRoutes);

// Secure analytics (admin only)
const jwt = require('jsonwebtoken');
app.get('/api/admin/analytics', async (req, res) => {
	const header = req.headers.authorization;
	if (!header) return res.status(401).json({ error: 'Missing auth' });
	try {
		const token = header.replace(/^Bearer\s+/i, '');
		const p = jwt.verify(token, process.env.JWT_SECRET);
		const user = await prisma.user.findUnique({ where: { id: p.userId } });
		if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
		const [cars, users, bookings, finance] = await Promise.all([
			prisma.car.count(),
			prisma.user.count(),
			prisma.serviceBooking.count(),
			prisma.financeApplication.count()
		]);
		let buyRequests = 0; try { const r = await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM "PurchaseRequest"`; buyRequests = Array.isArray(r) ? (r[0]?.c || 0) : (r?.c || 0); } catch { }
		res.json({ cars, users, serviceBookings: bookings, financeApplications: finance, buyRequests });
	} catch { res.status(401).json({ error: 'Invalid token' }); }
});

// Not found
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	req.log?.error({ err }, 'Unhandled error');
	const msg = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err?.message || 'Internal Error');
	res.status(err.status || 500).json({ error: msg });
});

if (require.main === module) {
	const PORT = process.env.PORT || 5000;
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
