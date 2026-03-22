'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Users, Clock, GraduationCap } from 'lucide-react';

export default function SupervisorDashboard() {
  const [ojts, setOjts] = useState<any[]>([]);
  const [recentDtr, setRecentDtr] = useState<any[]>([]);

  useEffect(() => {
    api.get('/assignments/my-ojt').then(({ data }) => setOjts(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (ojts.length) {
      // load DTR for all assigned OJTs
      const ids = ojts.map((o: any) => o.ojt?.id).filter(Boolean);
      if (ids.length) {
        api.get('/dtr', { params: { userId: ids[0], limit: 10 } })
          .then(({ data }) => setRecentDtr(data.data || [])).catch(() => {});
      }
    }
  }, [ojts]);

  return (
    <DashboardLayout title="Supervisor Dashboard" allowedRoles={['supervisor']}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card border border-cyan-400/20">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mb-3">
              <Users size={20} className="text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-cyan-400 mb-1">{ojts.length}</div>
            <div className="text-sm text-slate-500">Assigned OJT Employees</div>
          </div>
          <div className="stat-card border border-violet-400/20">
            <div className="w-10 h-10 rounded-xl bg-violet-400/10 flex items-center justify-center mb-3">
              <GraduationCap size={20} className="text-violet-400" />
            </div>
            <div className="text-3xl font-black text-violet-400 mb-1">{recentDtr.length}</div>
            <div className="text-sm text-slate-500">DTR Records Today</div>
          </div>
          <div className="stat-card border border-emerald-400/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center mb-3">
              <Clock size={20} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mb-1">
              {recentDtr.filter(r => r.status === 'present').length}
            </div>
            <div className="text-sm text-slate-500">Present Today</div>
          </div>
        </div>

        {/* My OJT List */}
        <div className="card">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-cyan-400" /> My OJT Employees
          </h2>
          {ojts.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ojts.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-[#0e1220] rounded-xl border border-[#1e2740]">
                  <div className="w-10 h-10 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-sm font-bold text-cyan-400">
                    {a.ojt?.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{a.ojt?.fullName}</div>
                    <div className="text-xs text-slate-500">{a.ojt?.school} · {a.ojt?.course}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No OJT employees assigned yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
