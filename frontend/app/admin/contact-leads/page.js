"use client";
import { useEffect, useState } from 'react';

export default function AdminContactLeadsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [token, setToken] = useState(null);
  // Default to NEW leads
  const [filters, setFilters] = useState({ status: 'new', q: '', page: 1 });
  // Debounced search input state
  const [qInput, setQInput] = useState('');
  const [data, setData] = useState({ leads: [], page: 1, pageSize: 50, total: 0, totalPages: 1 });
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [agents, setAgents] = useState([]);
  const [assignUserId, setAssignUserId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  useEffect(() => { try { const t = localStorage.getItem('token'); if (t) setToken(t); } catch { } }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t); } }, [toast]);

  // Apply debounce to search input => filters.q
  useEffect(() => {
    const h = setTimeout(() => setFilters(f => ({ ...f, q: qInput, page: 1 })), 300);
    return () => clearTimeout(h);
  }, [qInput]);

  const load = async () => {
    if (!token) return;
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    const res = await fetch(`${apiBase}/api/admin/contact-leads?${p.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setData(await res.json());
    else setToast({ type: 'error', msg: 'Failed to load' });
  };
  useEffect(() => { load(); }, [token, filters]);

  const setStatus = async (id, status) => {
    if (!token) return;
    setBusyId(id);
    try {
      const res = await fetch(`${apiBase}/api/admin/contact-leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
      if (res.ok) { setToast({ type: 'success', msg: 'Updated' }); load(); }
      else setToast({ type: 'error', msg: 'Update failed' });
    } finally { setBusyId(null); }
  };

  const openDetails = async (lead) => {
    setSelected(lead);
    setNotes([]); setNoteInput('');
    setTimeline([]);
    setAssignUserId('');
    if (!token) return;
    // Load notes
    try {
      const res = await fetch(`${apiBase}/api/admin/contact-leads/${lead.id}/notes`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setNotes(d.notes || []); }
    } catch { }
    // Load agents (once)
    try {
      if (!agents.length) {
        const r = await fetch(`${apiBase}/api/admin/agents`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) { const d = await r.json(); setAgents(d.agents || []); }
      }
    } catch { }
    // Load timeline
    try {
      setTimelineLoading(true);
      const r2 = await fetch(`${apiBase}/api/admin/contact-leads/${lead.id}/timeline`, { headers: { Authorization: `Bearer ${token}` } });
      if (r2.ok) { const d2 = await r2.json(); setTimeline(d2.items || []); }
    } finally { setTimelineLoading(false); }
  };

  const addNote = async () => {
    if (!token || !selected || !noteInput.trim()) return;
    const res = await fetch(`${apiBase}/api/admin/contact-leads/${selected.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ note: noteInput }) });
    if (res.ok) { const created = await res.json(); setNotes(n => [created, ...n]); setNoteInput(''); }
  };

  const exportCsv = () => {
    const p = new URLSearchParams(); Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    const url = `${apiBase}/api/admin/contact-leads/export?${p.toString()}`;
    // Use token via fetch to get blob, then download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.blob()).then(b => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'contact-leads.csv'; a.click(); URL.revokeObjectURL(a.href);
    }).catch(() => setToast({ type: 'error', msg: 'Export failed' }));
  };

  const assignSelected = async () => {
    if (!token || !selected || !assignUserId) return;
    setAssigning(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/contact-leads/${selected.id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId: assignUserId }) });
      if (res.ok) {
        setToast({ type: 'success', msg: 'Assigned' });
        // Refresh timeline to reflect assignment
        try {
          const r2 = await fetch(`${apiBase}/api/admin/contact-leads/${selected.id}/timeline`, { headers: { Authorization: `Bearer ${token}` } });
          if (r2.ok) { const d2 = await r2.json(); setTimeline(d2.items || []); }
        } catch { }
      } else {
        setToast({ type: 'error', msg: 'Assign failed' });
      }
    } finally { setAssigning(false); }
  };

  const deleteSelected = async () => {
    if (!token || !selected) return;
    const ok = window.confirm('Delete this lead? This cannot be undone.');
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/contact-leads/${selected.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setToast({ type: 'success', msg: 'Deleted' });
        setSelected(null);
        load();
      } else {
        setToast({ type: 'error', msg: 'Delete failed' });
      }
    } finally { setDeleting(false); }
  };

  return (
    <div className="p-8 text-white space-y-6">
      <h1 className="text-2xl font-bold">Contact Leads</h1>
      <div className="flex flex-wrap gap-4 bg-gray-800/40 p-4 rounded border border-gray-700">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Status</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Search</label>
          <input value={qInput} onChange={e => setQInput(e.target.value)} placeholder="name/email/phone" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div />
        <button onClick={exportCsv} className="px-3 py-1.5 text-xs rounded bg-gray-700 border border-gray-600">Export CSV</button>
      </div>
      <div className="overflow-x-auto border border-gray-700 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 text-gray-300">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Message</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.leads.map(lead => (
              <tr key={lead.id} className="border-t border-gray-700/60">
                <td className="p-2">{lead.id}</td>
                <td className="p-2"><button onClick={() => openDetails(lead)} className="underline underline-offset-2 decoration-gray-600 hover:text-white">{lead.name}</button></td>
                <td className="p-2 text-xs">{lead.email}</td>
                <td className="p-2 text-xs">{lead.phone || '-'}</td>
                <td className="p-2 text-xs max-w-md truncate" title={lead.message || ''}>{lead.message || '-'}</td>
                <td className="p-2 text-xs">{new Date(lead.createdAt).toLocaleString()}</td>
                <td className="p-2 text-xs">
                  <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide ${lead.status === 'new' ? 'bg-amber-600/40 text-amber-200' : lead.status === 'contacted' ? 'bg-blue-600/40 text-blue-200' : 'bg-emerald-600/40 text-emerald-200'}`}>{(lead.status || '').toUpperCase()}</span>
                </td>
                <td className="p-2 text-xs flex gap-2">
                  {lead.status === 'new' && (
                    <>
                      <button disabled={busyId === lead.id} onClick={() => setStatus(lead.id, 'contacted')} className="px-2 py-1 rounded bg-blue-600/60 disabled:opacity-40">Mark Contacted</button>
                      <button disabled={busyId === lead.id} onClick={() => setStatus(lead.id, 'closed')} className="px-2 py-1 rounded bg-emerald-600/60 disabled:opacity-40">Close</button>
                    </>
                  )}
                  {lead.status === 'contacted' && (
                    <>
                      <button disabled={busyId === lead.id} onClick={() => setStatus(lead.id, 'closed')} className="px-2 py-1 rounded bg-emerald-600/60 disabled:opacity-40">Close</button>
                      <button disabled={busyId === lead.id} onClick={() => setStatus(lead.id, 'new')} className="px-2 py-1 rounded bg-gray-600/60 disabled:opacity-40">Reopen</button>
                    </>
                  )}
                  {lead.status === 'closed' && (
                    <button disabled={busyId === lead.id} onClick={() => setStatus(lead.id, 'new')} className="px-2 py-1 rounded bg-gray-600/60 disabled:opacity-40">Reopen</button>
                  )}
                </td>
              </tr>
            ))}
            {!data.leads.length && <tr><td colSpan={8} className="p-4 text-center text-gray-500">No leads.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span>Page {data.page} / {data.totalPages}</span>
        <button disabled={data.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Prev</button>
        <button disabled={data.page >= data.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Next</button>
        <span className="text-gray-500">{data.total} total</span>
      </div>
      {toast && <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded border text-sm z-50 ${toast.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200' : 'bg-red-900/80 border-red-500/40 text-red-200'}`}>{toast.msg}</div>}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md h-full bg-gray-900 border-l border-gray-700 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold">Lead #{selected.id}</h3>
              <div className="ml-auto flex items-center gap-2">
                <select value={assignUserId} onChange={e => setAssignUserId(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs">
                  <option value="">Assign to…</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name || a.email} ({a.role})</option>
                  ))}
                </select>
                <button disabled={!assignUserId || assigning} onClick={assignSelected} className="px-2 py-1 rounded bg-blue-600 disabled:opacity-40">Assign</button>
                <button disabled={deleting} onClick={deleteSelected} className="px-2 py-1 rounded bg-red-700/80 border border-red-600 disabled:opacity-40">Delete</button>
                <button onClick={() => setSelected(null)} className="px-2 py-1 rounded bg-gray-700">Close</button>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="text-gray-400">Name:</span> {selected.name}</div>
              <div><span className="text-gray-400">Email:</span> {selected.email}</div>
              <div><span className="text-gray-400">Phone:</span> {selected.phone || '-'}</div>
              <div><span className="text-gray-400">Created:</span> {new Date(selected.createdAt).toLocaleString()}</div>
              <div><span className="text-gray-400">Message:</span> <div className="mt-1 p-2 bg-gray-800/60 rounded border border-gray-700 whitespace-pre-wrap">{selected.message || '-'}</div></div>
            </div>
            <div className="mt-6">
              <div className="text-sm font-semibold mb-2">Notes</div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Add a note" className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm" />
                  <button onClick={addNote} className="px-3 py-1 rounded bg-blue-600">Add</button>
                </div>
                <div className="space-y-2">
                  {notes.length === 0 ? (
                    <div className="text-xs text-gray-500">No notes yet.</div>
                  ) : notes.map(n => (
                    <div key={n.id} className="text-xs bg-gray-800/60 border border-gray-700 rounded p-2">
                      <div className="text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                      <div className="mt-1 whitespace-pre-wrap">{n.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-sm font-semibold mb-2">Timeline</div>
              {timelineLoading ? (
                <div className="text-xs text-gray-400">Loading…</div>
              ) : (
                <div className="space-y-2">
                  {(!timeline || timeline.length === 0) ? (
                    <div className="text-xs text-gray-500">No timeline yet.</div>
                  ) : timeline.map(item => (
                    <div key={`${item.kind}-${item.id}`} className="text-xs bg-gray-800/60 border border-gray-700 rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="uppercase tracking-wide text-[10px] text-gray-400">{item.kind}</span>
                        <span className="text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap">{item.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
