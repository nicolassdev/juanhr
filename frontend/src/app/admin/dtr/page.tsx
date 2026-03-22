'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Search, Download } from 'lucide-react';

export default function AdminDtrPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '', userId: '' });
  const [preview, setPreview] = useState<string | null>(null);

  const fetchDtr = async () => {
    try {
      const { data } = await api.get('/dtr', { params: filters });
      setRecords(data.data || []);
      setTotal(data.total || 0);
    } catch { }
  };

  useEffect(() => { fetchDtr(); }, [filters]);

  const fmtTime = (d: string) => d ? new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PH') : '—';
  const fmtHours = (min: number) => min ? `${Math.floor(min / 60)}h ${min % 60}m` : '—';

  const downloadExcel = (userId: number) => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dtr/export/excel/${userId}`, '_blank');
  const downloadPdf = (userId: number) => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dtr/export/pdf/${userId}`, '_blank');

  return (
    <DashboardLayout title="DTR Records" allowedRoles={['admin']}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="card flex flex-wrap gap-3">
          <div>
            <label className="label">Date From</label>
            <input type="date" className="input" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} />
          </div>
          <div>
            <label className="label">Date To</label>
            <input type="date" className="input" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2740]">
                  <th className="table-header px-4 py-3 text-left">Employee</th>
                  <th className="table-header px-4 py-3 text-left">Date</th>
                  <th className="table-header px-4 py-3 text-left">AM In</th>
                  <th className="table-header px-4 py-3 text-left">AM Out</th>
                  <th className="table-header px-4 py-3 text-left">PM In</th>
                  <th className="table-header px-4 py-3 text-left">PM Out</th>
                  <th className="table-header px-4 py-3 text-left">Hours</th>
                  <th className="table-header px-4 py-3 text-left">Status</th>
                  <th className="table-header px-4 py-3 text-left">Selfie</th>
                  <th className="table-header px-4 py-3 text-left">Export</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{r.user?.fullName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmtTime(r.amIn)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmtTime(r.amOut)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmtTime(r.pmIn)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmtTime(r.pmOut)}</td>
                    <td className="px-4 py-3 text-cyan-400 font-semibold">{fmtHours(r.totalMinutes)}</td>
                    <td className="px-4 py-3"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td className="px-4 py-3">
                      {r.amInSelfie ? (
                        <button onClick={() => setPreview(`http://localhost:3001${r.amInSelfie}`)}
                          className="text-xs text-cyan-400 hover:underline">View</button>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => downloadExcel(r.userId)} className="text-xs text-emerald-400 hover:underline">XLS</button>
                        <span className="text-slate-600">|</span>
                        <button onClick={() => downloadPdf(r.userId)} className="text-xs text-red-400 hover:underline">PDF</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!records.length && <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">No DTR records.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#1e2740] text-xs text-slate-500">{total} total records</div>
        </div>
      </div>

      {/* Selfie Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative">
            <img src={preview} alt="selfie" className="max-w-xs max-h-[80vh] rounded-2xl border border-[#1e2740]" />
            <button onClick={() => setPreview(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">✕</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
