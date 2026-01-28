"use client";
import { useMemo } from 'react';

export default function SpecsInlineClient({ specs, features }){
  const hasContent = (features && features.length) || (specs && Object.keys(specs||{}).length);
  const specEntries = useMemo(()=> Object.entries(specs||{}), [specs]);
  if(!hasContent){
    return null;
  }
  return (
    <div className="mt-3">
      <div className="rounded border border-gray-700 bg-gray-900/70 p-3">
        {Array.isArray(features) && features.length>0 && (
          <div className="mb-3">
            <div className="text-sm font-semibold mb-2">Features</div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-200 list-disc ml-5">
              {features.map((f,i)=> <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
        {specEntries.length>0 && (
          <div>
            <div className="text-sm font-semibold mb-2">Specifications</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {specEntries.map(([k,v])=> (
                <div key={k} className="rounded border border-gray-700 bg-gray-800/60 p-2">
                  <div className="uppercase tracking-wide text-[10px] text-gray-400">{k.replace(/_/g,' ')}</div>
                  <div className="font-medium break-words">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
