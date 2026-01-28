"use client";
import { useClientState } from '../lib/clientState';
import { useRouter } from 'next/navigation';

export default function CompareBar(){
  const { compareIds, toggleCompare } = useClientState();
  const router = useRouter();
  if (!compareIds.length) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-gray-900/90 backdrop-blur px-4 py-3 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
      <div className="text-xs text-gray-300">Selected: {compareIds.join(', ')} ({compareIds.length}/3)</div>
      <button onClick={()=>router.push(`/compare?ids=${compareIds.join(',')}`)} className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 font-semibold">Compare</button>
      <button onClick={()=>compareIds.forEach(id=>toggleCompare(id))} className="px-2 py-1 text-[10px] rounded border border-gray-600 hover:bg-gray-700">Clear</button>
    </div>
  );
}
