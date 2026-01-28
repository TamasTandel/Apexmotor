// Quick importer for a starter subset of Indian market cars with extended specs.
// Run with: node scripts/import_india_cars.js (ensure server running on port 5000)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const cars = [
  {
    make: 'Maruti Suzuki', model: 'Swift ZXI+', year: 2024, price: 9500, // USD approx
    exShowroomPriceINR: 920000,
    bodyType: 'Hatchback', region: 'IN',
    features: ['6 Airbags','ESP','LED Headlamps','Cruise Control'],
    specs: { engine_cc: 1197, fuel: 'Petrol', power_ps: 82, torque_nm: 111, transmission: '5MT/AMT', drivetrain: 'FWD', arai_mileage_kmpl: 24.8 }
  },
  {
    make: 'Hyundai', model: 'Creta 1.5 Turbo SX(O) DCT', year: 2024, price: 20500,
    exShowroomPriceINR: 2000000,
    bodyType: 'SUV', region: 'IN',
    features: ['ADAS L2','Panoramic Roof','Ventilated Seats','Bose Audio'],
    specs: { engine_cc: 1482, fuel: 'Petrol Turbo', power_ps: 160, torque_nm: 253, transmission: '7DCT', drivetrain: 'FWD', arai_mileage_kmpl: 18.4 }
  },
  {
    make: 'Tata', model: 'Nexon EV LR Empowered+', year: 2024, price: 21000,
    exShowroomPriceINR: 1990000,
    bodyType: 'EV SUV', region: 'IN',
    features: ['EV','Fast Charging','ADAS','360 Camera'],
    specs: { battery_kwh: 40.5, motor_power_ps: 143, torque_nm: 215, claimed_range_km: 465, charging_dc_kw: 50 }
  },
  {
    make: 'Mahindra', model: 'Scorpio N Z8L Diesel AT 4WD', year: 2024, price: 32000,
    exShowroomPriceINR: 3000000,
    bodyType: 'SUV', region: 'IN',
    features: ['4WD','Body-on-Frame','ADAS Prep','Terrain Modes'],
    specs: { engine_cc: 2184, fuel: 'Diesel Turbo', power_ps: 175, torque_nm: 400, transmission: '6AT', drivetrain: '4WD', arai_mileage_kmpl: 14.5 }
  },
  {
    make: 'Kia', model: 'Seltos 1.5 Turbo GTX+ DCT', year: 2024, price: 23000,
    exShowroomPriceINR: 2200000,
    bodyType: 'SUV', region: 'IN',
    features: ['ADAS','Heads-Up Display','Bose Audio','360 Camera'],
    specs: { engine_cc: 1482, fuel: 'Petrol Turbo', power_ps: 160, torque_nm: 253, transmission: '7DCT', drivetrain: 'FWD', arai_mileage_kmpl: 17.7 }
  },
  {
    make: 'Toyota', model: 'Innova Hycross ZX(O) Hybrid', year: 2024, price: 40000,
    exShowroomPriceINR: 3700000,
    bodyType: 'MPV', region: 'IN',
    features: ['Strong Hybrid','ADAS','Ottoman Seats','Dual Zone AC'],
    specs: { engine_cc: 1987, fuel: 'Petrol Hybrid', system_power_ps: 186, transmission: 'e-CVT', drivetrain: 'FWD', arai_mileage_kmpl: 23.2 }
  },
  {
    make: 'Honda', model: 'Elevate ZX CVT', year: 2024, price: 20000,
    exShowroomPriceINR: 1900000,
    bodyType: 'SUV', region: 'IN',
    features: ['ADAS (future update)','Single Pane Roof','Connected Car'],
    specs: { engine_cc: 1498, fuel: 'Petrol NA', power_ps: 121, torque_nm: 145, transmission: 'CVT', drivetrain: 'FWD', arai_mileage_kmpl: 16.9 }
  }
];

(async () => {
  const base = process.env.API_BASE || 'http://localhost:5000';
  for (const c of cars) {
    try {
      const res = await fetch(`${base}/api/cars`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(c) });
      if (!res.ok) console.error('Failed:', c.make, c.model, await res.text());
      else console.log('Imported:', c.make, c.model);
    } catch (e) {
      console.error('Error importing', c.make, c.model, e.message);
    }
  }
})();
