"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

interface Props {
  children: React.ReactNode;
  title: string;
  allowedRoles?: string[];
}

export default function DashboardLayout({
  children,
  title,
  allowedRoles,
}: Props) {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();
  const { init } = useThemeStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();
    loadFromStorage();
    // Mark as ready after hydration — prevents 403 from firing before token loads
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return; // wait for hydration
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [ready, user]);

  // Don't render children until auth is hydrated — prevents stale API calls
  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--accent)" }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar title={title} />
        <main
          className="flex-1 p-6 overflow-auto"
          style={{ background: "var(--bg)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
