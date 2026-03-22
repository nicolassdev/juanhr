'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

interface Props {
  children: React.ReactNode;
  title: string;
  allowedRoles?: string[];
}

export default function DashboardLayout({ children, title, allowedRoles }: Props) {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem('accessToken');
      if (!token) router.replace('/auth/login');
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user]);

  return (
    <div className="flex min-h-screen bg-[#080b12]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
