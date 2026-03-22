"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  BookOpen,
  LogOut,
  Clock,
  UserCheck,
  FileText,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3001";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/schedules", label: "Schedules", icon: CalendarDays },
  { href: "/admin/assignments", label: "Assignments", icon: UserCheck },
  { href: "/admin/dtr", label: "DTR Records", icon: ClipboardList },
  { href: "/admin/permissions", label: "Permissions", icon: ShieldCheck },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: BookOpen },
];
const supervisorLinks = [
  { href: "/supervisor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/supervisor/my-ojt", label: "Employees", icon: Users },
  { href: "/supervisor/dtr", label: "DTR Monitor", icon: ClipboardList },
];
const ojtLinks = [
  { href: "/ojt/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ojt/dtr", label: "Time Record (DTR)", icon: Clock },
  { href: "/ojt/profile", label: "My Profile", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const links =
    user?.role === "admin"
      ? adminLinks
      : user?.role === "supervisor"
        ? supervisorLinks
        : ojtLinks;

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    clearAuth();
    router.push("/auth/login");
  };

  const avatarSrc = user?.profileImage ? `${API}${user.profileImage}` : null;

  return (
    <aside
      className="w-64 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent4))",
            }}
          >
            🎓
          </div>
          <div>
            <div
              className="font-black text-lg leading-none"
              style={{ color: "var(--text)" }}
            >
              JuanHR
            </div>
            <div
              className="text-xs font-bold tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              v3
            </div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full border overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{
              borderColor: "var(--border)",
              background: "color-mix(in srgb, var(--accent) 15%, transparent)",
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-sm font-bold"
                style={{ color: "var(--accent)" }}
              >
                {user?.fullName?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text)" }}
            >
              {user?.fullName}
            </div>
            <div className={`text-xs font-semibold badge-${user?.role}`}>
              {user?.role?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${pathname === href || pathname.startsWith(href + "/") ? "active" : ""}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full"
          style={{ color: "#ef4444" }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
