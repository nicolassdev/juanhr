'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function OjtDashboard() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [todayDtr, setTodayDtr] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    api.get('/dtr/me/summary').then(({ data }) => setSummary(data)).catch(() => {});
    // Get today's DTR
    const today = new Date().toISOString().split('T')[0];
    api.get('/dtr/me', { params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } })
      .then(({ data }) => {
        const todayRec = data.records?.find((r: any) => r.date?.startsWith(today));
        setTodayDtr(todayRec || null);
      }).catch(() => {});
  }, [user]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const isClockedIn = todayDtr?.amIn && !todayDtr?.amOut;
  const isDayComplete = todayDtr?.amOut;

  return (
    <DashboardLayout title="My Dashboard" allowedRoles={['ojt']}>
      <div className="space-y-6">
        {/* Welcome + Clock */}
        <div className="card bg-gradient-to-br from-[#121828] to-[#0e1220] border-cyan-400/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-slate-400 text-sm mb-1">Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'},</div>
              <h1 className="text-2xl font-black text-white">{user?.fullName?.split(' ')[0]} 👋</h1>
              <div className="text-slate-500 text-sm mt-1">{dateStr}</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-cyan-400 font-mono">{timeStr}</div>
              <div className={`text-sm font-semibold mt-1 ${isClockedIn ? 'text-emerald-400' : isDayComplete ? 'text-violet-400' : 'text-slate-500'}`}>
                {isClockedIn ? '🟢 Clocked In' : isDayComplete ? '✅ Day Complete' : '⚪ Not Clocked In'}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/ojt/dtr" className="btn-primary inline-flex items-center gap-2">
              <Clock size={15} /> Go to Time Record (DTR)
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card border border-cyan-400/20">
            <div className="text-2xl font-black text-cyan-400">{summary?.totalHours ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-1">Total Hours Rendered</div>
          </div>
          <div className="stat-card border border-emerald-400/20">
            <div className="text-2xl font-black text-emerald-400">{summary?.present ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-1">Days Present</div>
          </div>
          <div className="stat-card border border-yellow-400/20">
            <div className="text-2xl font-black text-yellow-400">{summary?.late ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-1">Days Late</div>
          </div>
          <div className="stat-card border border-violet-400/20">
            <div className="text-2xl font-black text-violet-400">{summary?.totalDays ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-1">Total Days Logged</div>
          </div>
        </div>

        {/* Today's Status */}
        {todayDtr && (
          <div className="card">
            <h2 className="font-bold text-white mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-cyan-400" /> Today's Record
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'AM In', val: todayDtr.amIn, color: 'text-cyan-400' },
                { label: 'AM Out', val: todayDtr.amOut, color: 'text-violet-400' },
                { label: 'PM In', val: todayDtr.pmIn, color: 'text-orange-400' },
                { label: 'PM Out', val: todayDtr.pmOut, color: 'text-emerald-400' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-[#0e1220] rounded-xl p-3 border border-[#1e2740]">
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className={`font-mono font-bold text-sm ${val ? color : 'text-slate-600'}`}>
                    {val ? new Date(val).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`badge badge-${todayDtr.status}`}>{todayDtr.status}</span>
              {todayDtr.totalMinutes && (
                <span className="text-slate-400 text-sm">{Math.floor(todayDtr.totalMinutes / 60)}h {todayDtr.totalMinutes % 60}m rendered today</span>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
