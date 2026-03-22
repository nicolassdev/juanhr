'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

export default function SupervisorDtrPage() {
  const [ojts, setOjts] = useState<any[]>([]);
  const [selectedOjtId, setSelectedOjtId] = useState<number | null>(null);
  const [dtr, setDtr] = useState<any[]>([]);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    api.get('/assignments/my-ojt').then(({ data }) => setOjts(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedOjtId) {
      api.get(`/dtr/ojt/${selectedOjtId}`, { params: { month, year } })
        .then(({ data }) => setDtr(data.records || [])).catch(() => setDtr([]));
    }
  }, [selectedOjtId, month, year]);

  const fmtTime = (d: string) => d ? new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PH') : '—';
  const fmtHrs = (min: number) => min ? `${Math.floor(min / 60)}h ${min % 60}m` : '—';

  return (
    <DashboardLayout title="DTR Monitor" allowedRoles={['supervisor']}>
      <div className="space-y-4">
        <div className="card flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">OJT Employee</label>
            <select className="input w-56" value={selectedOjtId || ''} onChange={e => setSelectedOjtId(+e.target.value)}>
              <option value="">Select OJT...</option>
              {ojts.map((a: any) => <option key={a.ojt?.id} value={a.ojt?.id}>{a.ojt?.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select className="input w-32" value={month} onChange={e => setMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                  {new Date(2024, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="input w-24" value={year} onChange={e => setYear(e.target.value)}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2740]">
                  <th className="table-header px-4 py-3 text-left">Date</th>
                  <th className="table-header px-4 py-3 text-left">AM In</th>
                  <th className="table-header px-4 py-3 text-left">AM Out</th>
                  <th className="table-header px-4 py-3 text-left">PM In</th>
                  <th className="table-header px-4 py-3 text-left">PM Out</th>
                  <th className="table-header px-4 py-3 text-left">Hours</th>
                  <th className="table-header px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {dtr.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="px-4 py-3 text-white font-medium">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtTime(r.amIn)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtTime(r.amOut)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtTime(r.pmIn)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtTime(r.pmOut)}</td>
                    <td className="px-4 py-3 text-cyan-400 font-semibold text-xs">{fmtHrs(r.totalMinutes)}</td>
                    <td className="px-4 py-3"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
                {!dtr.length && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    {selectedOjtId ? 'No DTR records for this period.' : 'Select an OJT employee above.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
