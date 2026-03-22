'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { FileSpreadsheet, FileText, Printer, CalendarDays } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function SupervisorMyOjtPage() {
  const [ojts, setOjts] = useState<any[]>([]);
  const [selectedOjt, setSelectedOjt] = useState<any>(null);
  const [dtr, setDtr] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [assigningSchedule, setAssigningSchedule] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    api.get('/assignments/my-ojt').then(({ data }) => setOjts(data)).catch(() => {});
    api.get('/schedules').then(({ data }) => setSchedules(data)).catch(() => {});
  }, []);

  const loadDtr = async (ojtId: number) => {
    try {
      const { data } = await api.get(`/dtr/ojt/${ojtId}`, { params: { month, year } });
      setDtr(data.records || []);
    } catch { setDtr([]); }
    try {
      const { data } = await api.get(`/dtr/ojt/${ojtId}/summary`);
      setSummary(data);
    } catch { setSummary(null); }
  };

  const selectOjt = (ojt: any) => {
    setSelectedOjt(ojt);
    loadDtr(ojt.id);
  };

  useEffect(() => {
    if (selectedOjt) loadDtr(selectedOjt.id);
  }, [month, year]);

  const assignSchedule = async () => {
    if (!selectedSchedule || !selectedOjt) return;
    try {
      await api.post('/schedules/assign', { ojtId: selectedOjt.id, scheduleId: +selectedSchedule });
      setAssigningSchedule(false);
      alert('Schedule assigned!');
    } catch { alert('Failed to assign schedule'); }
  };

  const fmtTime = (d: string) => d ? new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—';
  const fmtHours = (min: number) => min ? `${Math.floor(min / 60)}h ${min % 60}m` : '—';

  const downloadExcel = () => window.open(`${API}/dtr/export/excel/${selectedOjt.id}?month=${month}&year=${year}`, '_blank');
  const downloadPdf = () => window.open(`${API}/dtr/export/pdf/${selectedOjt.id}?month=${month}&year=${year}`, '_blank');
  const handlePrint = () => window.print();

  return (
    <DashboardLayout title="My OJT Employees" allowedRoles={['supervisor']}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* OJT List */}
        <div className="card space-y-2">
          <h2 className="font-bold text-white mb-3 text-sm">OJT Employees</h2>
          {ojts.length ? ojts.map((a: any) => (
            <button
              key={a.id}
              onClick={() => selectOjt(a.ojt)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${selectedOjt?.id === a.ojt?.id ? 'bg-cyan-400/10 border border-cyan-400/20' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">
                {a.ojt?.fullName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{a.ojt?.fullName}</div>
                <div className="text-xs text-slate-500 truncate">{a.ojt?.course}</div>
              </div>
            </button>
          )) : <p className="text-slate-500 text-xs">No OJTs assigned.</p>}
        </div>

        {/* DTR Panel */}
        <div className="lg:col-span-3 space-y-4">
          {selectedOjt ? (
            <>
              {/* Header */}
              <div className="card flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center font-bold text-cyan-400">
                    {selectedOjt.fullName?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{selectedOjt.fullName}</div>
                    <div className="text-xs text-slate-500">{selectedOjt.school} · {selectedOjt.course}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setAssigningSchedule(true)} className="btn-outline flex items-center gap-1.5 text-xs px-3 py-2">
                    <CalendarDays size={13} /> Assign Schedule
                  </button>
                  <button onClick={downloadExcel} className="btn-success flex items-center gap-1.5 text-xs px-3 py-2">
                    <FileSpreadsheet size={13} /> Excel
                  </button>
                  <button onClick={downloadPdf} className="btn-danger flex items-center gap-1.5 text-xs px-3 py-2">
                    <FileText size={13} /> PDF
                  </button>
                  <button onClick={handlePrint} className="btn-outline flex items-center gap-1.5 text-xs px-3 py-2">
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>

              {/* Month Filter + Summary */}
              <div className="flex flex-wrap gap-3 items-end">
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
                {summary && (
                  <div className="flex gap-3 ml-auto flex-wrap">
                    <div className="card-sm text-center px-4">
                      <div className="text-xl font-black text-cyan-400">{summary.totalHours}</div>
                      <div className="text-xs text-slate-500">Total Hours</div>
                    </div>
                    <div className="card-sm text-center px-4">
                      <div className="text-xl font-black text-emerald-400">{summary.present}</div>
                      <div className="text-xs text-slate-500">Present</div>
                    </div>
                    <div className="card-sm text-center px-4">
                      <div className="text-xl font-black text-yellow-400">{summary.late}</div>
                      <div className="text-xs text-slate-500">Late</div>
                    </div>
                  </div>
                )}
              </div>

              {/* DTR Table */}
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
                        <th className="table-header px-4 py-3 text-left">Selfie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dtr.map(r => (
                        <tr key={r.id} className="table-row">
                          <td className="px-4 py-3 text-slate-300 font-medium">{fmtDate(r.date)}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fmtTime(r.amIn)}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fmtTime(r.amOut)}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fmtTime(r.pmIn)}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fmtTime(r.pmOut)}</td>
                          <td className="px-4 py-3 text-cyan-400 font-semibold text-xs">{fmtHours(r.totalMinutes)}</td>
                          <td className="px-4 py-3"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                          <td className="px-4 py-3">
                            {r.amInSelfie ? (
                              <button onClick={() => setPreview(`http://localhost:3001${r.amInSelfie}`)} className="text-xs text-cyan-400 hover:underline">View</button>
                            ) : <span className="text-slate-600 text-xs">—</span>}
                          </td>
                        </tr>
                      ))}
                      {!dtr.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No DTR records for this period.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card flex items-center justify-center h-48 text-slate-500">← Select an OJT employee to view DTR</div>
          )}
        </div>
      </div>

      {/* Schedule Assign Modal */}
      {assigningSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <h2 className="font-bold text-white text-lg mb-4">Assign Schedule to {selectedOjt?.fullName}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Select Schedule</label>
                <select className="input" value={selectedSchedule} onChange={e => setSelectedSchedule(e.target.value)}>
                  <option value="">Choose schedule...</option>
                  {schedules.map(s => <option key={s.id} value={s.id}>{s.name} ({s.amIn}–{s.amOut})</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setAssigningSchedule(false)} className="btn-outline">Cancel</button>
                <button onClick={assignSchedule} className="btn-primary">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selfie Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="selfie" className="max-w-xs max-h-[80vh] rounded-2xl border border-[#1e2740]" />
        </div>
      )}
    </DashboardLayout>
  );
}
