const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Mock Prisma
// Mock Prisma
const mockPrisma = {
    car: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
    },
    auditLog: {
        create: jest.fn(),
    },
    purchaseRequest: {
        count: jest.fn(),
    },
    serviceBooking: {
        count: jest.fn(),
    },
    financeApplication: {
        count: jest.fn(),
    },
    $queryRaw: jest.fn(),
};

jest.mock('@prisma/client', () => {
    return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Mock JWT
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

// Import app AFTER mocking
const app = require('../server');

describe('Backend Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/cars', () => {
        it('should return a list of cars', async () => {
            mockPrisma.car.count.mockResolvedValue(1);
            mockPrisma.car.findMany.mockResolvedValue([
                { id: 1, make: 'Toyota', model: 'Camry', price: 25000, image: 'http://example.com/car.jpg' }
            ]);
            mockPrisma.car.findMany.mockResolvedValueOnce([{ make: 'Toyota' }]); // for makes facet
            mockPrisma.car.findMany.mockResolvedValueOnce([{ bodyType: 'Sedan' }]); // for bodyTypes facet
            mockPrisma.car.findMany.mockResolvedValueOnce([{ category: 'Economy' }]); // for categories facet

            // Note: The route calls findMany 4 times (cars, makes, bodyTypes, categories)
            // We need to mock return values in order or use specific mock implementations if needed.
            // For simplicity, let's just ensure it returns 200 and the structure.

            // Re-mocking for specific calls sequence
            mockPrisma.car.findMany
                .mockResolvedValueOnce([ // cars
                    { id: 1, make: 'Toyota', model: 'Camry', price: 25000, image: 'http://example.com/car.jpg' }
                ])
                .mockResolvedValueOnce([{ make: 'Toyota' }]) // makes
                .mockResolvedValueOnce([{ bodyType: 'Sedan' }]) // bodyTypes
                .mockResolvedValueOnce([{ category: 'Economy' }]); // categories

            const res = await request(app).get('/api/cars');
            expect(res.statusCode).toBe(200);
            expect(res.body.cars).toHaveLength(1);
            expect(res.body.cars[0].make).toBe('Toyota');
        });
    });

    describe('POST /api/cars', () => {
        it('should fail if unauthorized (no token)', async () => {
            const res = await request(app).post('/api/cars').send({});
            expect(res.statusCode).toBe(401);
        });

        it('should fail if validation fails (missing fields)', async () => {
            // Mock auth success
            jwt.verify.mockReturnValue({ userId: 1 });
            mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: 'admin' });

            const res = await request(app)
                .post('/api/cars')
                .set('Authorization', 'Bearer validtoken')
                .send({ make: 'Toyota' }); // Missing model, year, price, etc.

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it('should create a car if valid and authorized', async () => {
            // Mock auth success
            jwt.verify.mockReturnValue({ userId: 1 });
            mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: 'admin' });

            const newCar = {
                make: 'Toyota',
                model: 'Corolla',
                year: 2022,
                price: 22000,
                image: 'http://example.com/corolla.jpg'
            };

            mockPrisma.car.create.mockResolvedValue({ id: 2, ...newCar });

            const res = await request(app)
                .post('/api/cars')
                .set('Authorization', 'Bearer validtoken')
                .send(newCar);

            expect(res.statusCode).toBe(200);
            expect(res.body.make).toBe('Toyota');
            expect(mockPrisma.car.create).toHaveBeenCalled();
        });
    });
});
