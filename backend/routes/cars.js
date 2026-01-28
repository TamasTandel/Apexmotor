const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { validate } = require('../middleware/validation');
const carsController = require('../controllers/cars');

const carSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1886),
  price: z.number().positive(),
  image: z.string().optional(),
  features: z.array(z.string()).optional(),
  bodyType: z.string().optional(),
  region: z.string().optional(),
  exShowroomPriceINR: z.number().optional(),
  specs: z.record(z.any()).optional(),
  category: z.string().optional(),
  odometerKm: z.number().optional(),
  lastServiceDate: z.string().optional(), // or z.date() if parsed
  saleStatus: z.string().optional()
});

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try { const payload = jwt.verify(token, process.env.JWT_SECRET); req.userId = payload.userId; next(); } catch { return res.status(401).json({ error: 'Invalid token' }); }
}
async function adminOnly(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Get all cars with optional filters & metadata
router.get('/', carsController.getAllCars);

// Get car by ID
router.get('/:id', carsController.getCarById);

// Compare endpoint ?ids=1,2,3
router.get('/compare/list', carsController.compareCars);

// Add new car
router.post('/', auth, adminOnly, validate(carSchema), carsController.createCar);

// Delete car (admin)
router.delete('/:id', auth, adminOnly, carsController.deleteCar);

// Update car (admin)
router.patch('/:id', auth, adminOnly, validate(carSchema.partial()), carsController.updateCar);

module.exports = router;
