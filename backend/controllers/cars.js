const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Helper for authenticity check
const OEM_DOMAINS = [
    'toyota.com', 'automobiles.honda.com', 'ford.com', 'chevrolet.com', 'nissanusa.com', 'hyundaiusa.com', 'kia.com', 'subaru.com', 'bmw.scene7.com', 'mbusa.com', 'audiusa.com', 'digitalassets.tesla.com', 'assets.volkswagen.com', 'vw.com', 'lexus.com', 'images-porsche.imgix.net', 'jlr.scene7.com', 'volvocars.com', 'jeep.com', 'gmc.com', 'dodge.com', 'mazdausa.com', 'miniusa.com', 'alfaromeousa.com', 'marutisuzuki.com', 'tatamotors.com', 'mahindra.com', 'skoda-auto.co.in', 'mgmotor.co.in', 'toyotabharat.com', 'jeep-india.com', 'lamborghini.com', 'ferrari.com', 'skoda-auto.com', 'auto.mahindra.com'
];

function checkAuthenticity(image) {
    let authentic = false;
    try {
        const h = new URL(image).hostname.replace(/^www\./, '');
        authentic = OEM_DOMAINS.some(d => h.endsWith(d));
    } catch { }
    return authentic;
}

exports.getAllCars = async (req, res) => {
    const { make, bodyType, q, category, region, saleStatus, minPrice, maxPrice, minPriceINR, maxPriceINR, sort, page = 1, pageSize = 24 } = req.query;
    const where = {};
    if (make) where.make = { contains: make, mode: 'insensitive' };
    if (bodyType) {
        const list = bodyType.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length === 1) where.bodyType = { equals: list[0] };
        else if (list.length > 1) where.bodyType = { in: list };
    }
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (region) where.region = { equals: region };
    if (saleStatus) where.saleStatus = { equals: saleStatus };
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (minPriceINR || maxPriceINR) {
        where.exShowroomPriceINR = {};
        if (minPriceINR) where.exShowroomPriceINR.gte = parseFloat(minPriceINR);
        if (maxPriceINR) where.exShowroomPriceINR.lte = parseFloat(maxPriceINR);
    }
    if (q) {
        where.OR = [
            { make: { contains: q, mode: 'insensitive' } },
            { model: { contains: q, mode: 'insensitive' } },
            { features: { hasSome: [q] } }
        ];
    }
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };
    const p = parseInt(page) || 1;
    const size = Math.min(500, Math.max(1, parseInt(pageSize) || 24)); // allow larger page sizes for admin views
    const total = await prisma.car.count({ where });
    const carsRaw = await prisma.car.findMany({ where, orderBy, skip: (p - 1) * size, take: size });

    const cars = carsRaw.map(c => ({ ...c, authentic: checkAuthenticity(c.image) }));

    // Provide distinct facet values for UI filters
    const makes = await prisma.car.findMany({
        select: { make: true },
        distinct: ['make']
    });
    const bodyTypes = await prisma.car.findMany({
        select: { bodyType: true },
        distinct: ['bodyType']
    });
    const categories = await prisma.car.findMany({ select: { category: true }, distinct: ['category'] });
    res.json({
        cars,
        makes: makes.map(m => m.make).filter(Boolean).sort(),
        bodyTypes: bodyTypes.map(b => b.bodyType).filter(Boolean).sort(),
        categories: categories.map(c => c.category).filter(Boolean).sort(),
        page: p,
        pageSize: size,
        total,
        totalPages: Math.ceil(total / size)
    });
};

exports.getCarById = async (req, res) => {
    const id = req.params.id;
    console.log('getCarById request for ID:', id);
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    const car = await prisma.car.findUnique({ where: { id } });
    console.log('getCarById result:', car ? 'Found' : 'Not Found');
    if (!car) return res.status(404).json({ error: 'Not found' });
    // Fetch similar: same category first, else same bodyType, exclude self
    const similar = await prisma.car.findMany({
        where: {
            id: { not: id },
            OR: [
                car.category ? { category: car.category } : undefined,
                car.bodyType ? { bodyType: car.bodyType } : undefined,
                { make: car.make }
            ].filter(Boolean)
        },
        take: 6
    });

    res.json({ car: { ...car, authentic: checkAuthenticity(car.image) }, similar });
};

exports.compareCars = async (req, res) => {
    const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return res.json([]);

    const found = await prisma.car.findMany({ where: { id: { in: ids.slice(0, 3) } } });
    const cars = found.map(c => ({ ...c, authentic: checkAuthenticity(c.image) }));
    res.json({ cars });
};

exports.createCar = async (req, res) => {
    try {
        const { make, model, year, price, image, features = [], bodyType, region = 'US', exShowroomPriceINR, specs } = req.body;
        if (!make || !model) return res.status(400).json({ error: 'make and model required' });
        const finalImage = image && image.startsWith('http') ? image : `https://source.unsplash.com/800x450/?${encodeURIComponent(make + ' ' + model + ' car')}`;
        const car = await prisma.car.create({
            data: { make, model, year, price, image: finalImage, features, bodyType, region, exShowroomPriceINR, specs }
        });
        try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'CAR_CREATE', targetType: 'CAR', targetId: car.id, metadata: { make, model } } }); } catch { }
        res.json(car);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create car' });
    }
};

exports.deleteCar = async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    try {
        const bookingCount = await prisma.serviceBooking.count({ where: { carId: id } });
        if (bookingCount > 0) return res.status(409).json({ error: 'Cannot delete car with service bookings' });
        await prisma.favorite.deleteMany({ where: { carId: id } });
        const deleted = await prisma.car.delete({ where: { id } });
        try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'CAR_DELETE', targetType: 'CAR', targetId: id, metadata: { make: deleted.make, model: deleted.model } } }); } catch { }
        res.json({ ok: true });
    } catch { res.status(404).json({ error: 'Not found' }); }
};

exports.updateCar = async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    const allow = ['make', 'model', 'year', 'price', 'image', 'features', 'bodyType', 'region', 'exShowroomPriceINR', 'specs', 'category', 'odometerKm', 'lastServiceDate', 'saleStatus'];
    const data = {};
    for (const k of allow) { if (k in req.body) data[k] = req.body[k]; }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No fields supplied' });
    try {
        const existing = await prisma.car.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        const updated = await prisma.car.update({ where: { id }, data });
        try { await prisma.auditLog.create({ data: { actorId: req.userId, action: 'CAR_UPDATE', targetType: 'CAR', targetId: id, metadata: { before: existing, after: updated } } }); } catch { }
        res.json(updated);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to update' }); }
};
