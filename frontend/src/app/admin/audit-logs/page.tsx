'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [module, setModule] = useState('');

  useEffect(() => {
    api.get('/audit-logs', { params: { module, limit: 100 } })
      .then(({ data }) => { setLogs(data.data || []); setTotal(data.total || 0); })
      .catch(() => {});
  }, [module]);

  const actionColor: Record<string, string> = {
    LOGIN: 'text-cyan-400', LOGOUT: 'text-slate-400',
    CREATE_USER: 'text-emerald-400', DELETE_USER: 'text-red-400',
    UPDATE_USER: 'text-yellow-400', LOCK_USER: 'text-orange-400',
    DTR_AM_IN: 'text-cyan-400', DTR_AM_OUT: 'text-violet-400',
    CHANGE_ROLE: 'text-violet-400', ASSIGN_SUPERVISOR: 'text-orange-400',
  };

  return (
    <DashboardLayout title="Audit Logs" allowedRoles={['admin']}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <select className="input w-48" value={module} onChange={e => setModule(e.target.value)}>
            <option value="">All Modules</option>
            <option value="auth">Auth</option>
            <option value="users">Users</option>
            <option value="dtr">DTR</option>
            <option value="schedules">Schedules</option>
            <option value="departments">Departments</option>
            <option value="assignments">Assignments</option>
          </select>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2740]">
                  <th className="table-header px-4 py-3 text-left">Timestamp</th>
                  <th className="table-header px-4 py-3 text-left">User</th>
                  <th className="table-header px-4 py-3 text-left">Action</th>
                  <th className="table-header px-4 py-3 text-left">Module</th>
                  <th className="table-header px-4 py-3 text-left">Target</th>
                  <th className="table-header px-4 py-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id.toString()} className="table-row">
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('en-PH')}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{l.user?.fullName || 'System'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${actionColor[l.action] || 'text-slate-400'}`}>{l.action}</span>
                    </td>
                    <td className="px-4 py-3"><span className="badge bg-[#1e2740] text-slate-400">{l.module}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{l.targetType} #{l.targetId || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-mono">{l.ipAddress || '—'}</td>
                  </tr>
                ))}
                {!logs.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No logs found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#1e2740] text-xs text-slate-500">{total} total entries</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
