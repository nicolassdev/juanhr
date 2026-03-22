'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Users, Building2, GraduationCap, UserCheck, Clock } from 'lucide-react';

interface Stats {
  totalOjt: number;
  totalSupervisors: number;
  totalDepartments: number;
  totalUsers: number;
  recentUsers: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDtr, setRecentDtr] = useState<any[]>([]);

  useEffect(() => {
    api.get('/users/dashboard').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/dtr?limit=5').then(({ data }) => setRecentDtr(data.data || [])).catch(() => {});
  }, []);

  const statCards = [
    { label: 'OJT Employees', value: stats?.totalOjt ?? '—', icon: GraduationCap, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
    { label: 'Supervisors', value: stats?.totalSupervisors ?? '—', icon: UserCheck, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
    { label: 'Departments', value: stats?.totalDepartments ?? '—', icon: Building2, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  ];

  return (
    <DashboardLayout title="Dashboard" allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`stat-card border ${bg}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                <Icon size={20} className={color} />
              </div>
              <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Users size={16} className="text-cyan-400" /> Recent Registrations
            </h2>
            <div className="space-y-3">
              {stats?.recentUsers?.length ? stats.recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[#1e2740]/50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                    {u.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{u.fullName}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                  <span className={`badge badge-${u.role?.name}`}>{u.role?.name}</span>
                </div>
              )) : <p className="text-slate-500 text-sm">No users yet.</p>}
            </div>
          </div>

          {/* Recent DTR */}
          <div className="card">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" /> Recent DTR Activity
            </h2>
            <div className="space-y-3">
              {recentDtr.length ? recentDtr.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[#1e2740]/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{r.user?.fullName}</div>
                    <div className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString('en-PH')}</div>
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                  <span className="text-xs text-slate-500">{r.totalMinutes ? `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m` : 'ongoing'}</span>
                </div>
              )) : <p className="text-slate-500 text-sm">No DTR records yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
