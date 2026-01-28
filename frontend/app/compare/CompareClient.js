"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useClientState } from '../../lib/clientState';
import { formatINR, convertUSDToINR, formatUSD } from '../../lib/currency';

function formatNumber(n){
  if (n==null) return '—';
  return typeof n === 'number' ? n.toLocaleString() : n;
}

export default function CompareClient({ initialCars }) {
  const params = useSearchParams();
  const router = useRouter();
  const { compareIds, toggleCompare } = useClientState();
  const [cars, setCars] = useState(initialCars);
  const ids = params.get('ids')?.split(',').filter(Boolean) || [];

  const [loading, setLoading] = useState(false);
  useEffect(()=>{
    // refetch when ids change client-side
    const fetchCars = async () => {
      if (!ids.length) { setCars([]); return; }
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/cars/compare/list?ids=${ids.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setCars(data.cars||[]);
      }
      setLoading(false);
    };
    fetchCars();
  }, [ids.join(',')]);

  // Derived stats for highlighting best values (e.g., highest HP, lowest 0-100 time)
  const best = useMemo(()=>{
    const hpVals = cars.map(c=> Number(c.specs?.horsepower || c.specs?.powerHP || c.specs?.hp) || 0);
    const torqueVals = cars.map(c=> Number(c.specs?.torqueNm || c.specs?.torqueNM || c.specs?.torque) || 0);
    const zeroVals = cars.map(c=> {
      const z = c.specs?.zeroToHundred || c.specs?.zeroToSixty; if (!z) return Infinity; const n=parseFloat(String(z)); return isNaN(n)? Infinity : n; });
    return {
      maxHP: Math.max(0, ...hpVals),
      maxTorque: Math.max(0, ...torqueVals),
      minZero: Math.min(...zeroVals)
    };
  }, [cars]);

  const removeId = (id)=>{
    const newIds = ids.filter(x=>x!==String(id));
    toggleCompare(Number(id));
    router.replace(newIds.length? `/compare?ids=${newIds.join(',')}` : '/compare');
  };

  if (!ids.length) return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Compare Cars</h1>
      <p className="text-gray-400">No cars selected. Go back and choose up to three cars to compare.</p>
    </div>
  );

  const specRows = [
    ['Price (INR)', (c)=> { const v = c.exShowroomPriceINR || convertUSDToINR(c.price, process.env.NEXT_PUBLIC_USD_TO_INR); return formatINR(v); }],
    ['Price (USD)', (c)=> c.price!=null? formatUSD(c.price):'—'],
    ['Body Type', (c)=>c.bodyType||'—'],
    ['Category', (c)=>c.category||'—'],
    ['Mileage', (c)=>c.mileage? formatNumber(c.mileage)+' km':'—'],
    ['Horsepower (HP)', (c)=>c.specs?.horsepower||c.specs?.powerHP||c.specs?.hp||'—', (val)=> Number(val)===best.maxHP && best.maxHP>0],
    ['Torque (Nm)', (c)=>c.specs?.torqueNm||c.specs?.torqueNM||c.specs?.torque||'—', (val)=> Number(val)===best.maxTorque && best.maxTorque>0],
    ['Range (EV)', (c)=>c.specs?.range||'—'],
    ['0-100 km/h', (c)=>c.specs?.zeroToHundred||c.specs?.zeroToSixty||'—', (val)=> { const num=parseFloat(val); return !isNaN(num) && num===best.minZero && best.minZero!==Infinity; }],
    ['Transmission', (c)=>c.specs?.transmission||'—'],
    ['Drivetrain', (c)=>c.specs?.drivetrain||'—'],
    ['Fuel / Energy', (c)=>c.specs?.fuelType||c.specs?.energyType||'—'],
    ['Weight (kg)', (c)=>c.specs?.weightKg||c.specs?.curbWeightKg||'—'],
    ['Power-to-Weight (HP/t)', (c)=>{ const hp = Number(c.specs?.horsepower||c.specs?.powerHP||c.specs?.hp); const w = Number(c.specs?.weightKg||c.specs?.curbWeightKg); if (!hp || !w) return '—'; return (hp / (w/1000)).toFixed(2); }],
    ['Key Features', (c)=>(c.features||[]).slice(0,6).join(', ')||'—']
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Compare Cars</h1>
        <div className="flex gap-2 text-xs">
          {ids.map(id => (
            <span key={id} className="px-2 py-1 rounded bg-gray-800 border border-gray-700 flex items-center gap-1">#{id}<button onClick={()=>removeId(id)} className="text-red-400 ml-1">×</button></span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-x-4 border-spacing-y-2" aria-busy={loading ? 'true':'false'} aria-live="polite">
          <caption className="sr-only">Side-by-side vehicle specification comparison</caption>
          <thead>
            <tr>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wide">Spec</th>
              {(loading? ids: cars).map(c => (
                <th key={c.id} className="text-left align-top">
                  {loading ? (
                    <div className="animate-pulse space-y-2 py-2">
                      <div className="h-4 bg-gray-700 rounded w-24" />
                      <div className="h-3 bg-gray-700 rounded w-12" />
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-2 w-36 h-20 overflow-hidden rounded border border-gray-700 bg-gray-900">
                        <img src={c.image} alt={`${c.make} ${c.model}`} className="object-cover w-full h-full" loading="lazy" />
                        {typeof c.authentic==='boolean' && (
                          <span className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded backdrop-blur border ${c.authentic? 'bg-emerald-600/70 border-emerald-400/40 text-emerald-100':'bg-amber-600/60 border-amber-400/40 text-amber-100'}`}>{c.authentic? 'OEM':'ALT'}</span>
                        )}
                        <button onClick={()=>removeId(String(c.id))} className="absolute top-1 right-1 bg-black/50 hover:bg-red-600/70 text-white text-[10px] px-1 rounded" aria-label={`Remove ${c.make} ${c.model} from comparison`}>×</button>
                      </div>
                      <div className="font-semibold">{c.make} {c.model}</div>
                      <div className="text-xs text-gray-400">{c.year}</div>
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specRows.map(([label, getter, highlightFn]) => (
              <tr key={label} className="align-top">
                <td className="text-xs font-medium text-gray-400 pr-4 py-2 whitespace-nowrap">{label}</td>
                {cars.map(c => {
                  const raw = loading ? null : getter(c);
                  const isHighlight = !loading && highlightFn ? highlightFn(raw, c) : false;
                  return (
                    <td key={c.id+label} className={`text-sm py-2 pr-4 ${isHighlight? 'bg-emerald-900/40 border border-emerald-600/30 rounded':''}`}>{loading ? <span className="inline-block h-3 bg-gray-700 rounded w-16 animate-pulse" /> : raw}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
