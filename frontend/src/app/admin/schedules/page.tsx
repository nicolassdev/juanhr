'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', periodType: 'one_period',
    amIn: '08:00', amOut: '12:00', pmIn: '13:00', pmOut: '17:00',
    workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], graceMinutes: 15,
  });

  const fetch = () => api.get('/schedules').then(({ data }) => setSchedules(data)).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const toggleDay = (d: string) => {
    setForm(p => ({
      ...p,
      workDays: p.workDays.includes(d) ? p.workDays.filter(x => x !== d) : [...p.workDays, d],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schedules', form);
      toast.success('Schedule created');
      setShowModal(false);
      fetch();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this schedule?')) return;
    try { await api.delete(`/schedules/${id}`); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  return (
    <DashboardLayout title="Schedules" allowedRoles={['admin']}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={15} /> New Schedule</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map(s => {
            const days: string[] = JSON.parse(s.workDays || '[]');
            return (
              <div key={s.id} className="card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white">{s.name}</h3>
                    <span className="badge bg-cyan-400/10 text-cyan-400 mt-1">{s.periodType === 'two_period' ? '2 Period' : '1 Period'}</span>
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="btn-danger p-1.5"><Trash2 size={13} /></button>
                </div>
                <div className="space-y-1 text-sm text-slate-400">
                  <div>🌅 AM: <span className="text-white">{s.amIn} – {s.amOut}</span></div>
                  {s.periodType === 'two_period' && <div>🌇 PM: <span className="text-white">{s.pmIn} – {s.pmOut}</span></div>}
                  <div>⏱ Grace: <span className="text-white">{s.graceMinutes} min</span></div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {DAYS.map(d => (
                    <span key={d} className={`text-xs px-2 py-0.5 rounded-full font-medium ${days.includes(d) ? 'bg-cyan-400/15 text-cyan-400' : 'bg-[#1e2740] text-slate-600'}`}>{d}</span>
                  ))}
                </div>
              </div>
            );
          })}
          {!schedules.length && <p className="text-slate-500 col-span-3">No schedules yet.</p>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={18} /></button>
            <h2 className="font-bold text-white text-lg mb-5">New Schedule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Schedule Name</label>
                <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Standard 8-5" />
              </div>
              <div>
                <label className="label">Period Type</label>
                <select className="input" value={form.periodType} onChange={e => setForm(p => ({ ...p, periodType: e.target.value }))}>
                  <option value="one_period">1 Period (No break)</option>
                  <option value="two_period">2 Period (AM + PM)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">AM In</label><input type="time" className="input" value={form.amIn} onChange={e => setForm(p => ({ ...p, amIn: e.target.value }))} /></div>
                <div><label className="label">AM Out</label><input type="time" className="input" value={form.amOut} onChange={e => setForm(p => ({ ...p, amOut: e.target.value }))} /></div>
                {form.periodType === 'two_period' && <>
                  <div><label className="label">PM In</label><input type="time" className="input" value={form.pmIn} onChange={e => setForm(p => ({ ...p, pmIn: e.target.value }))} /></div>
                  <div><label className="label">PM Out</label><input type="time" className="input" value={form.pmOut} onChange={e => setForm(p => ({ ...p, pmOut: e.target.value }))} /></div>
                </>}
                <div><label className="label">Grace (minutes)</label><input type="number" className="input" value={form.graceMinutes} onChange={e => setForm(p => ({ ...p, graceMinutes: +e.target.value }))} /></div>
              </div>
              <div>
                <label className="label">Work Days</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.workDays.includes(d) ? 'bg-cyan-400/15 border-cyan-400/40 text-cyan-400' : 'border-[#1e2740] text-slate-500 hover:border-slate-500'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
