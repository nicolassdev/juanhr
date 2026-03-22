"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { Users, Clock, GraduationCap } from "lucide-react";
import Link from "next/link";

const FILE_API =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3001";

export default function SupervisorDashboard() {
  const [ojts, setOjts] = useState<any[]>([]);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/assignments/my-ojt")
      .then(async ({ data }) => {
        setOjts(data);
        // Load today's DTR for each assigned OJT using the allowed endpoint
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const records: any[] = [];
        for (const a of data.slice(0, 5)) {
          if (!a.ojt?.id) continue;
          try {
            const { data: dtrData } = await api.get(`/dtr/ojt/${a.ojt.id}`, {
              params: { month, year },
            });
            const todayStr = new Date().toISOString().split("T")[0];
            const todayRec = (dtrData.records || []).find((r: any) => {
              const d = new Date(r.date);
              return (
                d.getUTCFullYear() === today.getFullYear() &&
                d.getUTCMonth() === today.getMonth() &&
                d.getUTCDate() === today.getDate()
              );
            });
            if (todayRec) records.push({ ...todayRec, ojt: a.ojt });
          } catch {}
        }
        setTodayRecords(records);
      })
      .catch(() => {});
  }, []);

  const presentToday = todayRecords.filter((r) => r.amIn).length;

  return (
    <DashboardLayout title="Supervisor Dashboard" allowedRoles={["supervisor"]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="stat-card"
            style={{
              border:
                "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 10%, transparent)",
              }}
            >
              <Users size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div
              className="text-3xl font-black mb-1"
              style={{ color: "var(--accent)" }}
            >
              {ojts.length}
            </div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Assigned OJT Employees
            </div>
          </div>
          <div
            className="stat-card"
            style={{ border: "1px solid rgba(139,92,246,0.2)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "rgba(139,92,246,0.1)" }}
            >
              <GraduationCap size={20} className="text-violet-400" />
            </div>
            <div className="text-3xl font-black text-violet-400 mb-1">
              {todayRecords.length}
            </div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              With DTR Today
            </div>
          </div>
          <div
            className="stat-card"
            style={{ border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              <Clock size={20} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mb-1">
              {presentToday}
            </div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Clocked In Today
            </div>
          </div>
        </div>

        {/* OJT Employee Cards */}
        <div className="card">
          <h2
            className="font-bold mb-4 flex items-center gap-2"
            style={{ color: "var(--text)" }}
          >
            <Users size={16} style={{ color: "var(--accent)" }} /> My OJT
            Employees
          </h2>
          {ojts.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ojts.map((a: any) => {
                const todayRec = todayRecords.find(
                  (r) => r.ojt?.id === a.ojt?.id,
                );
                const statusDot = todayRec?.amIn ? "🟢" : "⚪";
                return (
                  <Link
                    key={a.id}
                    href="/supervisor/my-ojt"
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor =
                        "var(--accent)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor =
                        "var(--border)")
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-full border overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: "var(--border)",
                        background:
                          "color-mix(in srgb, var(--accent) 10%, transparent)",
                      }}
                    >
                      {a.ojt?.profileImage ? (
                        <img
                          src={`${FILE_API}${a.ojt.profileImage}`}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <span
                          className="text-sm font-bold"
                          style={{ color: "var(--accent)" }}
                        >
                          {a.ojt?.fullName?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {a.ojt?.fullName}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: "var(--muted)" }}
                      >
                        {a.ojt?.school} · {a.ojt?.course}
                      </div>
                    </div>
                    <span className="text-sm flex-shrink-0">{statusDot}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No OJT employees assigned yet.
            </p>
          )}
        </div>

        {/* Today's Activity */}
        {todayRecords.length > 0 && (
          <div className="card">
            <h2
              className="font-bold mb-4 flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <Clock size={16} style={{ color: "var(--accent)" }} /> Today's DTR
              Activity
            </h2>
            <div className="space-y-2">
              {todayRecords.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex-1">
                    <div
                      className="text-sm font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {r.ojt?.fullName}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      In:{" "}
                      {r.amIn
                        ? new Date(r.amIn).toLocaleTimeString("en-PH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                      {(r.amOut || r.pmOut) &&
                        ` · Out: ${new Date(r.pmOut || r.amOut).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`}
                    </div>
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                  {r.totalMinutes > 0 && (
                    <span
                      className="text-xs font-bold"
                      style={{ color: "var(--accent)" }}
                    >
                      {Math.floor(r.totalMinutes / 60)}h {r.totalMinutes % 60}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
