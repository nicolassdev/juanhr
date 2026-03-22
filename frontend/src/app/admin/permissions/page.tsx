'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ShieldCheck, ShieldX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPerms, setUserPerms] = useState<any[]>([]);

  useEffect(() => {
    api.get('/permissions').then(({ data }) => setPermissions(data)).catch(() => {});
    api.get('/users?limit=100').then(({ data }) => setUsers(data.data || [])).catch(() => {});
  }, []);

  const loadUserPerms = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
    try {
      const { data } = await api.get(`/users/${userId}`);
      // merge with all permissions
      const granted = data.userPermissions?.map((p: any) => p.permissionId) || [];
      setUserPerms(granted);
    } catch { setUserPerms([]); }
  };

  const togglePerm = async (permId: number) => {
    if (!selectedUser) return;
    const currently = userPerms.includes(permId);
    try {
      await api.post('/permissions/assign', {
        userId: selectedUser.id,
        permissionId: permId,
        granted: !currently,
      });
      setUserPerms(p => currently ? p.filter(x => x !== permId) : [...p, permId]);
      toast.success(currently ? 'Permission revoked' : 'Permission granted');
    } catch { toast.error('Failed'); }
  };

  const grouped = permissions.reduce((acc: any, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <DashboardLayout title="Permissions" allowedRoles={['admin']}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="card space-y-2">
          <h2 className="font-bold text-white mb-3">Select User</h2>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => loadUserPerms(u.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${selectedUser?.id === u.id ? 'bg-cyan-400/10 border border-cyan-400/20' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="w-7 h-7 rounded-full bg-cyan-400/10 flex items-center justify-center text-xs font-bold text-cyan-400">
                {u.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{u.fullName}</div>
                <div className={`text-xs badge-${u.role?.name}`}>{u.role?.name}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center font-bold text-cyan-400">
                  {selectedUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white">{selectedUser.fullName}</div>
                  <div className="text-xs text-slate-500">Manage permissions</div>
                </div>
              </div>

              {Object.entries(grouped).map(([mod, perms]: [string, any]) => (
                <div key={mod} className="card space-y-2">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">{mod}</h3>
                  {perms.map((p: any) => {
                    const granted = userPerms.includes(p.id);
                    return (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#1e2740]/50 last:border-0">
                        <div>
                          <div className="text-sm font-medium text-white">{p.label}</div>
                          <div className="text-xs text-slate-500 font-mono">{p.key}</div>
                        </div>
                        <button
                          onClick={() => togglePerm(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${granted ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25' : 'bg-[#1e2740] border-[#1e2740] text-slate-500 hover:border-slate-500'}`}
                        >
                          {granted ? <><ShieldCheck size={12} /> Granted</> : <><ShieldX size={12} /> Revoked</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="card flex items-center justify-center h-48 text-slate-500">
              ← Select a user to manage permissions
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
