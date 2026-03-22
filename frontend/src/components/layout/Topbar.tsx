"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, Sun, Moon, X, Check, CheckCheck } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";

interface Notif {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
}

export default function Topbar({ title }: { title: string }) {
  const { user } = useAuthStore();
  const { dark, toggle, init } = useThemeStore();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, []);

  const loadNotifs = () => {
    api
      .get("/notifications")
      .then(({ data }) => setNotifs(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifs();
    const id = setInterval(loadNotifs, 30000); // poll every 30s
    return () => clearInterval(id);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter((n) => !n.isRead).length;

  const markOne = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {}
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const typeIcon: Record<string, string> = {
    USER_CREATED: "👤",
    SUPERVISOR_ASSIGNED: "🔗",
    DTR_IN: "⏰",
    DTR_OUT: "✅",
    SCHEDULE_ASSIGNED: "📅",
    default: "🔔",
  };

  return (
    <header
      className="h-16 border-b sticky top-0 z-30 flex items-center justify-between px-6 backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <h1
        className="font-black text-xl tracking-tight"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl border transition-all hover:scale-105"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          title={dark ? "Switch to Light mode" : "Switch to Dark mode"}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification bell */}
        <div ref={panelRef} className="relative">
          <button
            onClick={() => setShowPanel((p) => !p)}
            className="relative p-2 rounded-xl border transition-all"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <Bell size={16} />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showPanel && (
            <div
              className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--border)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <span
                  className="font-bold text-sm"
                  style={{ color: "var(--text)" }}
                >
                  Notifications{" "}
                  {unread > 0 && (
                    <span style={{ color: "var(--accent)" }}>({unread})</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAll}
                      className="text-xs flex items-center gap-1 transition-all"
                      style={{ color: "var(--muted)" }}
                      title="Mark all read"
                    >
                      <CheckCheck size={13} /> All read
                    </button>
                  )}
                  <button
                    onClick={() => setShowPanel(false)}
                    style={{ color: "var(--muted)" }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-96">
                {notifs.length === 0 && (
                  <div
                    className="py-10 text-center text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    No notifications yet
                  </div>
                )}
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-all"
                    style={{
                      borderColor: "var(--border)",
                      background: n.isRead
                        ? "transparent"
                        : "color-mix(in srgb, var(--accent) 5%, transparent)",
                    }}
                    onClick={() => !n.isRead && markOne(n.id)}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {typeIcon[n.type] || typeIcon.default}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {n.title}
                      </div>
                      {n.body && (
                        <div
                          className="text-xs mt-0.5 truncate"
                          style={{ color: "var(--muted)" }}
                        >
                          {n.body}
                        </div>
                      )}
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--muted)" }}
                      >
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    {!n.isRead && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {notifs.length > 0 && (
                <div
                  className="px-4 py-2 text-xs text-center border-t"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  {notifs.length} notification{notifs.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold overflow-hidden"
          style={{
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--accent) 15%, transparent)",
            color: "var(--accent)",
          }}
        >
          {user?.profileImage ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3001"}${user.profileImage}`}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            user?.fullName?.charAt(0)
          )}
        </div>
      </div>
    </header>
  );
}
