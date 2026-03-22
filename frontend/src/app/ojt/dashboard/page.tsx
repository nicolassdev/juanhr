"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/api";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3001";

// Derives exactly what action is next and what status label to show
function getClockStatus(dtr: any | null): {
  label: string;
  sublabel: string;
  color: string;
  dot: string;
  nextAction: string;
  isDone: boolean;
} {
  if (!dtr)
    return {
      label: "Not Clocked In",
      sublabel: 'Tap "Go to DTR" to clock in',
      color: "text-slate-400",
      dot: "⚪",
      nextAction: "Clock In (AM)",
      isDone: false,
    };
  // AM In done, AM Out pending
  if (dtr.amIn && !dtr.amOut)
    return {
      label: "Clocked In (AM)",
      sublabel: `AM In: ${new Date(dtr.amIn).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`,
      color: "text-emerald-400",
      dot: "🟢",
      nextAction: "Clock Out (AM)",
      isDone: false,
    };
  // AM Out done, PM In pending (two-period)
  if (dtr.amIn && dtr.amOut && !dtr.pmIn)
    return {
      label: "AM Complete",
      sublabel: `AM Out: ${new Date(dtr.amOut).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`,
      color: "text-violet-400",
      dot: "🟡",
      nextAction: "Clock In (PM)",
      isDone: false,
    };
  // PM In done, PM Out pending
  if (dtr.pmIn && !dtr.pmOut)
    return {
      label: "Clocked In (PM)",
      sublabel: `PM In: ${new Date(dtr.pmIn).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`,
      color: "text-orange-400",
      dot: "🟠",
      nextAction: "Clock Out (PM)",
      isDone: false,
    };
  // All done
  return {
    label: "Day Complete",
    sublabel: `Total: ${dtr.totalMinutes ? Math.floor(dtr.totalMinutes / 60) + "h " + (dtr.totalMinutes % 60) + "m" : "—"}`,
    color: "text-cyan-400",
    dot: "✅",
    nextAction: "Day done!",
    isDone: true,
  };
}

export default function OjtDashboard() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [todayDtr, setTodayDtr] = useState<any>(null);
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setDateStr(
        now.toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadDtr = () => {
    const today = new Date().toISOString().split("T")[0];
    api
      .get("/dtr/me", {
        params: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      })
      .then(({ data }) => {
        const rec = data.records?.find((r: any) => r.date?.startsWith(today));
        setTodayDtr(rec || null);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    api
      .get("/dtr/me/summary")
      .then(({ data }) => setSummary(data))
      .catch(() => {});
    loadDtr();
  }, [user]);

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "morning"
      : now.getHours() < 18
        ? "afternoon"
        : "evening";
  const status = getClockStatus(todayDtr);
  const avatarSrc = user?.profileImage ? `${API}${user.profileImage}` : null;

  const steps = [
    {
      key: "amIn",
      label: "AM In",
      val: todayDtr?.amIn,
      color: "text-cyan-400",
      border: "border-cyan-400/20",
    },
    {
      key: "amOut",
      label: "AM Out",
      val: todayDtr?.amOut,
      color: "text-violet-400",
      border: "border-violet-400/20",
    },
    {
      key: "pmIn",
      label: "PM In",
      val: todayDtr?.pmIn,
      color: "text-orange-400",
      border: "border-orange-400/20",
    },
    {
      key: "pmOut",
      label: "PM Out",
      val: todayDtr?.pmOut,
      color: "text-emerald-400",
      border: "border-emerald-400/20",
    },
  ];

  return (
    <DashboardLayout title="My Dashboard" allowedRoles={["ojt"]}>
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="card border-cyan-400/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-violet-500/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full border-2 border-cyan-400/30 overflow-hidden bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-cyan-400">
                    {user?.fullName?.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <div className="text-slate-400 text-sm">Good {greeting},</div>
                <h1 className="text-2xl font-black text-white leading-tight">
                  {user?.fullName?.split(" ")[0]} 👋
                </h1>
                <div className="text-slate-500 text-xs mt-0.5">{dateStr}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-cyan-400 font-mono tracking-tight">
                {timeStr}
              </div>
              <div className={`text-sm font-semibold mt-1 ${status.color}`}>
                {status.dot} {status.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {status.sublabel}
              </div>
            </div>
          </div>

          {/* Next Action Banner */}
          {!status.isDone && (
            <div className="relative mt-4 flex items-center justify-between bg-[#0e1220] rounded-xl px-4 py-3 border border-[#1e2740]">
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Next action</div>
                <div className="text-sm font-bold text-white">
                  {status.nextAction}
                </div>
              </div>
              <Link
                href="/ojt/dtr"
                className="btn-primary flex items-center gap-2 text-sm py-2"
              >
                <Clock size={14} /> Go to DTR <ArrowRight size={13} />
              </Link>
            </div>
          )}
          {status.isDone && (
            <div className="relative mt-4 bg-emerald-400/5 border border-emerald-400/20 rounded-xl px-4 py-3 text-center">
              <span className="text-emerald-400 font-semibold text-sm">
                🎉 Great work today! Day complete.
              </span>
            </div>
          )}
        </div>

        {/* Today's Time Record — 4 step boxes */}
        <div className="card">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-cyan-400" /> Today's Time Record
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map(({ key, label, val, color, border }) => {
              const isNext =
                !val &&
                !status.isDone &&
                status.nextAction
                  .toLowerCase()
                  .includes(
                    label.toLowerCase().split(" ")[1] || label.toLowerCase(),
                  );
              return (
                <div
                  key={key}
                  className={`rounded-xl p-3 border ${border} ${val ? "bg-[#0e1220]" : isNext ? "bg-[#0e1220] border-dashed" : "bg-[#090d18]"}`}
                >
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    {label}
                    {isNext && (
                      <span className="text-[10px] text-cyan-400 animate-pulse">
                        ● next
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-mono font-bold text-sm ${val ? color : "text-slate-700"}`}
                  >
                    {val
                      ? new Date(val).toLocaleTimeString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
              );
            })}
          </div>
          {todayDtr && (
            <div className="mt-3 flex items-center gap-3">
              <span className={`badge badge-${todayDtr.status}`}>
                {todayDtr.status}
              </span>
              {todayDtr.totalMinutes > 0 && (
                <span className="text-slate-400 text-sm">
                  {Math.floor(todayDtr.totalMinutes / 60)}h{" "}
                  {todayDtr.totalMinutes % 60}m rendered today
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Hours",
              val: summary?.totalHours ?? "—",
              color: "text-cyan-400",
              border: "border-cyan-400/20",
            },
            {
              label: "Days Present",
              val: summary?.present ?? "—",
              color: "text-emerald-400",
              border: "border-emerald-400/20",
            },
            {
              label: "Days Late",
              val: summary?.late ?? "—",
              color: "text-yellow-400",
              border: "border-yellow-400/20",
            },
            {
              label: "Total Days",
              val: summary?.totalDays ?? "—",
              color: "text-violet-400",
              border: "border-violet-400/20",
            },
          ].map(({ label, val, color, border }) => (
            <div key={label} className={`stat-card border ${border}`}>
              <div className={`text-2xl font-black ${color}`}>{val}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
