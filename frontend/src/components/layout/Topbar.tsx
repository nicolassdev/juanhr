'use client';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function Topbar({ title }: { title: string }) {
  const { user } = useAuthStore();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setNotifCount(data.filter((n: any) => !n.isRead).length);
    }).catch(() => {});
  }, []);

  return (
    <header className="h-16 border-b border-[#1e2740] bg-[#080b12]/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="font-black text-xl text-white tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl border border-[#1e2740] hover:border-cyan-400/30 transition-all">
          <Bell size={16} className="text-slate-400" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 text-[#080b12] text-[9px] font-black rounded-full flex items-center justify-center">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-[#1e2740] flex items-center justify-center text-xs font-bold text-cyan-400">
          {user?.fullName?.charAt(0)}
        </div>
      </div>
    </header>
  );
}
