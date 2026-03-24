"use client";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { downloadExcel, downloadPdf } from "@/lib/download";
import {
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  AlertTriangle,
  CheckCircle,
  User,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

const FILE_API =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3001";

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return (
    d.getUTCFullYear() === n.getFullYear() &&
    d.getUTCMonth() === n.getMonth() &&
    d.getUTCDate() === n.getDate()
  );
}

const statusStyle: Record<
  string,
  { bg: string; text: string; label: string; icon: any }
> = {
  present: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-500",
    label: "Present",
    icon: CheckCircle,
  },
  late: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-500",
    label: "Late",
    icon: Clock,
  },
  missing_logs: {
    bg: "bg-red-500/15",
    text: "text-red-500",
    label: "Missing Logs",
    icon: AlertTriangle,
  },
  half_day: {
    bg: "bg-blue-500/15",
    text: "text-blue-500",
    label: "Half Day",
    icon: Clock,
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle[status] || statusStyle.present;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <s.icon size={10} /> {s.label}
    </span>
  );
}

export default function AdminDtrPage() {
  const [ojtUsers, setOjtUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dtr, setDtr] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [dlLoading, setDlLoading] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get("/dtr/admin/ojt-summary")
      .then(({ data }) => setOjtUsers(data))
      .catch(() => {});
  }, []);

  const loadDtr = async (userId: number) => {
    try {
      const [d, s] = await Promise.all([
        api.get(`/dtr/ojt/${userId}`, { params: { month, year } }),
        api.get(`/dtr/ojt/${userId}/summary`),
      ]);
      setDtr(d.data.records || []);
      setSummary(s.data);
    } catch {
      setDtr([]);
      setSummary(null);
    }
  };

  const openPanel = (u: any) => {
    setSelectedUser(u);
    setPanelOpen(true);
    loadDtr(u.id);
  };
  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  useEffect(() => {
    if (selectedUser) loadDtr(selectedUser.id);
  }, [month, year]);

  const handleExcel = async () => {
    if (!selectedUser) return;
    setDlLoading("excel");
    try {
      await downloadExcel(selectedUser.id, selectedUser.fullName, month, year);
    } catch {
      toast.error("Download failed");
    } finally {
      setDlLoading(null);
    }
  };
  const handlePdf = async () => {
    if (!selectedUser) return;
    setDlLoading("pdf");
    try {
      await downloadPdf(selectedUser.id, selectedUser.fullName, month, year);
    } catch {
      toast.error("Download failed");
    } finally {
      setDlLoading(null);
    }
  };

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=960,height=700");
    if (!win) return;
    win.document
      .write(`<!DOCTYPE html><html><head><title>DTR — ${selectedUser?.fullName}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 11px; color: #1a2438; padding: 24px; }
h1 { text-align: center; font-size: 20px; font-weight: 900; margin-bottom: 4px; }
.sub { text-align: center; color: #5a6a8a; margin-bottom: 12px; font-size: 11px; }
.stats { display: flex; justify-content: center; gap: 32px; margin: 10px 0 16px; }
.stat { text-align: center; }
.stat-val { font-size: 18px; font-weight: 900; }
.stat-lbl { font-size: 10px; color: #5a6a8a; }
hr { border: none; border-top: 1px solid #dde3ef; margin: 12px 0; }
table { width: 100%; border-collapse: collapse; }
thead tr { background: #1a2340; }
thead th { color: #00d4ff; padding: 7px 8px; text-align: center; font-size: 10px; text-transform: uppercase; }
tbody tr:nth-child(even) { background: #f5f9fc; }
td { padding: 6px 8px; text-align: center; border-bottom: 1px solid #eee; }
td.date { text-align: left; font-weight: 600; }
td.hours { color: #0098c0; font-weight: 700; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 700; }
.badge-present { background: #dcfce7; color: #166534; }
.badge-late { background: #fef3c7; color: #92400e; }
.badge-missing_logs { background: #fee2e2; color: #991b1b; }
tfoot td { font-weight: 900; padding: 10px 8px; background: #e8f4f8; color: #0098c0; font-size: 12px; text-align: center; }
</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  const fmtTime = (d: string) =>
    d
      ? new Date(d).toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const fmtHrs = (min: number) =>
    min ? `${Math.floor(min / 60)}h ${min % 60}m` : "—";
  const fmtDay = (d: string) => {
    if (!d) return { num: "—", mon: "", wday: "" };
    const dt = new Date(d);
    const local = new Date(
      dt.getUTCFullYear(),
      dt.getUTCMonth(),
      dt.getUTCDate(),
    );
    return {
      num: local.getDate(),
      mon: local.toLocaleString("en", { month: "short" }),
      wday: local.toLocaleString("en", { weekday: "long" }),
    };
  };

  const totalMin = dtr
    .filter((r) => r.status !== "missing_logs")
    .reduce((s, r) => s + (r.totalMinutes || 0), 0);
  const present = dtr.filter((r) => r.status === "present").length;
  const late = dtr.filter((r) => r.status === "late").length;
  const missing = dtr.filter((r) => r.status === "missing_logs").length;
  const periodLabel = new Date(+year, +month - 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });

  const filtered = ojtUsers.filter((u) => {
    const matchName =
      !search || u.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      !statusFilter ||
      (() => {
        if (statusFilter === "present" && u.present > 0) return true;
        if (statusFilter === "late" && u.late > 0) return true;
        if (statusFilter === "missing_logs" && u.missingLogs > 0) return true;
        if (statusFilter === "clocked_in" && u.todayRecord?.amIn) return true;
        return false;
      })();
    return matchName && matchStatus;
  });

  return (
    <DashboardLayout title="DTR Records" allowedRoles={["admin"]}>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                className="input pl-9"
                placeholder="Search employee…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Employees</option>
              <option value="clocked_in">Clocked In Today</option>
              <option value="present">Has Present Days</option>
              <option value="late">Has Late Days</option>
              <option value="missing_logs">Has Missing Logs</option>
            </select>
          </div>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {filtered.length} employees
          </span>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total OJT",
              val: ojtUsers.length,
              color: "var(--accent)",
            },
            {
              label: "Clocked In Today",
              val: ojtUsers.filter((u) => u.todayRecord?.amIn).length,
              color: "#22c55e",
            },
            {
              label: "With Missing Logs",
              val: ojtUsers.filter((u) => u.missingLogs > 0).length,
              color: "#ef4444",
            },
            {
              label: "Late Records",
              val: ojtUsers.reduce((s, u) => s + (u.late || 0), 0),
              color: "#f59e0b",
            },
          ].map(({ label, val, color }) => (
            <div key={label} className="card-sm text-center">
              <div className="text-2xl font-black" style={{ color }}>
                {val}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Employee Cards */}
        {filtered.length === 0 && (
          <div
            className="card text-center py-16"
            style={{ color: "var(--muted)" }}
          >
            <User size={40} className="mx-auto mb-3 opacity-30" />
            <p>No OJT employees found.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((u) => {
            const today = u.todayRecord;
            const todayStatus = today?.status || null;
            const hasMissing = u.missingLogs > 0;
            return (
              <div
                key={u.id}
                onClick={() => openPanel(u)}
                className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:shadow-lg group"
                style={{
                  background: "var(--card-bg)",
                  borderColor: hasMissing
                    ? "rgba(239,68,68,0.3)"
                    : "var(--border)",
                  boxShadow: "var(--shadow)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    hasMissing ? "#ef4444" : "var(--accent)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    hasMissing ? "rgba(239,68,68,0.3)" : "var(--border)")
                }
              >
                {/* Missing logs warning banner */}
                {hasMissing && (
                  <div
                    className="px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                      borderBottom: "1px solid rgba(239,68,68,0.15)",
                    }}
                  >
                    <AlertTriangle size={11} /> {u.missingLogs} Missing Log
                    {u.missingLogs !== 1 ? "s" : ""} detected
                  </div>
                )}

                <div className="p-5 flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-2xl border-2 overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: "var(--border)",
                      background:
                        "color-mix(in srgb, var(--accent) 12%, transparent)",
                    }}
                  >
                    {u.profileImage ? (
                      <img
                        src={`${FILE_API}${u.profileImage}`}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <span
                        className="text-xl font-black"
                        style={{ color: "var(--accent)" }}
                      >
                        {u.fullName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold truncate"
                      style={{ color: "var(--text)" }}
                    >
                      {u.fullName}
                    </div>
                    <div
                      className="text-xs truncate mt-0.5 flex items-center gap-1.5"
                      style={{ color: "var(--muted)" }}
                    >
                      {u.school && (
                        <>
                          <GraduationCap size={10} /> {u.school}
                        </>
                      )}
                      {u.course && (
                        <>
                          <BookOpen size={10} /> {u.course}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="px-5 pb-4">
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {[
                      { label: "Days", val: u.totalDays, color: "var(--text)" },
                      { label: "Present", val: u.present, color: "#22c55e" },
                      { label: "Late", val: u.late, color: "#f59e0b" },
                      {
                        label: "Missing",
                        val: u.missingLogs,
                        color: u.missingLogs > 0 ? "#ef4444" : "var(--muted)",
                      },
                    ].map(({ label, val, color }) => (
                      <div
                        key={label}
                        className="text-center rounded-lg py-1.5"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div className="text-sm font-black" style={{ color }}>
                          {val}
                        </div>
                        <div
                          className="text-[9px]"
                          style={{ color: "var(--muted)" }}
                        >
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Today's status */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      Today:{" "}
                      {today?.amIn ? (
                        <span style={{ color: "var(--text)" }}>
                          In {fmtTime(today.amIn)}
                          {today.amOut
                            ? ` · Out ${fmtTime(today.pmOut || today.amOut)}`
                            : " · clocked in"}
                        </span>
                      ) : (
                        <span>No record</span>
                      )}
                    </div>
                    {todayStatus && <StatusBadge status={todayStatus} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SLIDE-IN DETAIL PANEL ── */}
      <div
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          opacity: panelOpen ? 1 : 0,
          pointerEvents: panelOpen ? "auto" : "none",
        }}
        onClick={closePanel}
      />

      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: "min(700px, 95vw)",
          background: "var(--card-bg)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {selectedUser && (
          <>
            {/* Panel header */}
            <div
              className="flex-shrink-0 p-5 border-b flex items-center gap-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl border-2 overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  borderColor: "var(--border)",
                  background:
                    "color-mix(in srgb, var(--accent) 12%, transparent)",
                }}
              >
                {selectedUser.profileImage ? (
                  <img
                    src={`${FILE_API}${selectedUser.profileImage}`}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <span
                    className="text-2xl font-black"
                    style={{ color: "var(--accent)" }}
                  >
                    {selectedUser.fullName?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="font-black text-lg truncate"
                  style={{ color: "var(--text)" }}
                >
                  {selectedUser.fullName}
                </h2>
                <div
                  className="text-xs mt-0.5 flex flex-wrap gap-x-3"
                  style={{ color: "var(--muted)" }}
                >
                  {selectedUser.email && <span>{selectedUser.email}</span>}
                  {selectedUser.school && <span>🎓 {selectedUser.school}</span>}
                </div>
              </div>
              <button
                onClick={closePanel}
                className="p-2 rounded-xl flex-shrink-0"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "var(--muted)")
                }
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    label: "Total Hours",
                    val: fmtHrs(totalMin),
                    color: "var(--accent)",
                  },
                  { label: "Present", val: present, color: "#22c55e" },
                  { label: "Late", val: late, color: "#f59e0b" },
                  {
                    label: "Missing Logs",
                    val: missing,
                    color: missing > 0 ? "#ef4444" : "var(--muted)",
                  },
                ].map(({ label, val, color }) => (
                  <div key={label} className="card-sm text-center">
                    <div className="text-xl font-black" style={{ color }}>
                      {val}
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--muted)" }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Missing logs alert */}
              {missing > 0 && (
                <div
                  className="rounded-xl p-3 text-sm flex items-start gap-2 border"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    borderColor: "rgba(239,68,68,0.25)",
                    color: "#ef4444",
                  }}
                >
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">
                      {missing} Missing Log{missing !== 1 ? "s" : ""} Found
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      Records where clock-in or clock-out is incomplete. Hours
                      are excluded from total.
                    </div>
                  </div>
                </div>
              )}

              {/* Month/Year + Export */}
              <div className="flex flex-wrap gap-2 items-end justify-between">
                <div className="flex gap-2">
                  <div>
                    <label className="label">Month</label>
                    <select
                      className="input w-28 text-xs"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option
                          key={i + 1}
                          value={String(i + 1).padStart(2, "0")}
                        >
                          {new Date(2024, i).toLocaleString("en", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <select
                      className="input w-20 text-xs"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    >
                      {[2023, 2024, 2025, 2026].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleExcel}
                    disabled={dlLoading === "excel"}
                    className="btn-success flex items-center gap-1 text-xs px-3 py-2"
                  >
                    <FileSpreadsheet size={13} />{" "}
                    {dlLoading === "excel" ? "Downloading…" : "Excel"}
                  </button>
                  <button
                    onClick={handlePdf}
                    disabled={dlLoading === "pdf"}
                    className="btn-danger flex items-center gap-1 text-xs px-3 py-2"
                  >
                    <FileText size={13} />{" "}
                    {dlLoading === "pdf" ? "Downloading…" : "PDF"}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="btn-outline flex items-center gap-1 text-xs px-3 py-2"
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>

              {/* DTR Record cards */}
              <div className="space-y-2">
                {dtr.length === 0 && (
                  <div
                    className="card-sm text-center py-8"
                    style={{ color: "var(--muted)" }}
                  >
                    No records for this period.
                  </div>
                )}
                {dtr.map((r) => {
                  const day = fmtDay(r.date);
                  const isExp = expandedId === r.id;
                  const today = isToday(r.date);
                  const isMissing = r.status === "missing_logs";
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border overflow-hidden transition-all"
                      style={{
                        borderColor: isMissing
                          ? "rgba(239,68,68,0.35)"
                          : today
                            ? "var(--accent)"
                            : "var(--border)",
                        background: "var(--card-bg)",
                        boxShadow: isMissing
                          ? "0 0 0 1px rgba(239,68,68,0.15)"
                          : "none",
                      }}
                    >
                      {/* Header */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                        style={{
                          background: isMissing
                            ? "rgba(239,68,68,0.04)"
                            : today
                              ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                              : "transparent",
                        }}
                        onClick={() => setExpandedId(isExp ? null : r.id)}
                      >
                        {/* Date */}
                        <div className="w-11 text-center flex-shrink-0">
                          <div
                            className="text-xl font-black leading-none"
                            style={{
                              color: isMissing
                                ? "#ef4444"
                                : today
                                  ? "var(--accent)"
                                  : "var(--text)",
                            }}
                          >
                            {day.num}
                          </div>
                          <div
                            className="text-[10px] uppercase"
                            style={{ color: "var(--muted)" }}
                          >
                            {day.mon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-semibold flex items-center gap-2 flex-wrap"
                            style={{ color: "var(--text)" }}
                          >
                            {day.wday}
                            {today && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{
                                  background: "var(--accent)",
                                  color: "var(--bg)",
                                }}
                              >
                                TODAY
                              </span>
                            )}
                          </div>
                          <div
                            className="text-xs mt-0.5 flex gap-3"
                            style={{ color: "var(--muted)" }}
                          >
                            {r.amIn && (
                              <span>
                                In:{" "}
                                <b style={{ color: "var(--text)" }}>
                                  {fmtTime(r.amIn)}
                                </b>
                              </span>
                            )}
                            {(r.amOut || r.pmOut) && (
                              <span>
                                Out:{" "}
                                <b style={{ color: "var(--text)" }}>
                                  {fmtTime(r.pmOut || r.amOut)}
                                </b>
                              </span>
                            )}
                            {isMissing && (
                              <span className="text-red-400 flex items-center gap-1">
                                <AlertTriangle size={10} /> Incomplete
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Hours pill */}
                        <div
                          className="rounded-xl px-3 py-1.5 font-black text-sm flex-shrink-0"
                          style={{
                            background: isMissing
                              ? "rgba(239,68,68,0.1)"
                              : r.totalMinutes
                                ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                                : "var(--surface)",
                            color: isMissing
                              ? "#ef4444"
                              : r.totalMinutes
                                ? "var(--accent)"
                                : "var(--muted)",
                          }}
                        >
                          {isMissing ? "—" : fmtHrs(r.totalMinutes)}
                        </div>
                        <StatusBadge status={r.status} />
                        <button
                          style={{ color: "var(--muted)" }}
                          className="flex-shrink-0"
                        >
                          {isExp ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isExp && (
                        <div
                          className="px-4 pb-4 pt-3 space-y-2"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          {[
                            {
                              label: "Clock In (AM)",
                              time: r.amIn,
                              selfie: r.amInSelfie,
                              type: "in",
                              missing: r.amIn && !r.amOut,
                            },
                            {
                              label: "Clock Out (AM)",
                              time: r.amOut,
                              selfie: r.amOutSelfie,
                              type: "out",
                              missing: !r.amIn && r.amOut,
                            },
                            {
                              label: "Clock In (PM)",
                              time: r.pmIn,
                              selfie: r.pmInSelfie,
                              type: "in",
                              missing: r.pmIn && !r.pmOut,
                            },
                            {
                              label: "Clock Out (PM)",
                              time: r.pmOut,
                              selfie: r.pmOutSelfie,
                              type: "out",
                              missing: !r.pmIn && r.pmOut,
                            },
                          ]
                            .filter((e) => e.time || e.missing)
                            .map(
                              ({
                                label,
                                time,
                                selfie,
                                type,
                                missing: isMiss,
                              }) => (
                                <div
                                  key={label}
                                  className="flex items-center gap-3 py-2 rounded-xl px-3"
                                  style={{
                                    background: isMiss
                                      ? "rgba(239,68,68,0.06)"
                                      : "var(--surface)",
                                    border: isMiss
                                      ? "1px dashed rgba(239,68,68,0.3)"
                                      : "none",
                                  }}
                                >
                                  <div
                                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                                    style={{
                                      background: isMiss
                                        ? "rgba(239,68,68,0.1)"
                                        : type === "in"
                                          ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                                          : "rgba(168,85,247,0.15)",
                                    }}
                                  >
                                    {isMiss ? (
                                      <AlertTriangle
                                        size={12}
                                        className="text-red-400"
                                      />
                                    ) : (
                                      <Clock
                                        size={12}
                                        style={{
                                          color:
                                            type === "in"
                                              ? "var(--accent)"
                                              : "#a855f7",
                                        }}
                                      />
                                    )}
                                  </div>
                                  <span
                                    className="text-xs font-medium flex-1"
                                    style={{
                                      color: isMiss
                                        ? "#f87171"
                                        : "var(--muted)",
                                    }}
                                  >
                                    {label} {isMiss && "— MISSING"}
                                  </span>
                                  <span
                                    className="text-sm font-bold"
                                    style={{
                                      color: time ? "var(--text)" : "#f87171",
                                    }}
                                  >
                                    {time ? fmtTime(time) : "Not recorded"}
                                  </span>
                                  {selfie && (
                                    <button
                                      onClick={() =>
                                        setSelfieUrl(`${FILE_API}${selfie}`)
                                      }
                                      className="w-9 h-9 rounded-lg overflow-hidden border flex-shrink-0 hover:opacity-80"
                                      style={{ borderColor: "var(--border)" }}
                                    >
                                      <img
                                        src={`${FILE_API}${selfie}`}
                                        className="w-full h-full object-cover"
                                        alt="selfie"
                                      />
                                    </button>
                                  )}
                                </div>
                              ),
                            )}

                          {/* Hours summary */}
                          {!isMissing && r.totalMinutes > 0 && (
                            <div
                              className="flex items-center justify-between px-3 py-2 rounded-xl"
                              style={{
                                background:
                                  "color-mix(in srgb, var(--accent) 8%, transparent)",
                              }}
                            >
                              <span
                                className="text-xs font-semibold"
                                style={{ color: "var(--muted)" }}
                              >
                                Total Rendered Hours
                              </span>
                              <span
                                className="font-black text-base"
                                style={{ color: "var(--accent)" }}
                              >
                                {fmtHrs(r.totalMinutes)}
                              </span>
                            </div>
                          )}
                          {isMissing && (
                            <div
                              className="px-3 py-2 rounded-xl text-xs"
                              style={{
                                background: "rgba(239,68,68,0.08)",
                                color: "#f87171",
                                border: "1px solid rgba(239,68,68,0.2)",
                              }}
                            >
                              ⚠️ This record has incomplete logs. Hours are{" "}
                              <strong>excluded</strong> from the total to
                              prevent incorrect computation.
                            </div>
                          )}
                          {r.notes && (
                            <div
                              className="text-xs px-3 py-2 rounded-lg"
                              style={{
                                background: "var(--surface)",
                                color: "var(--muted)",
                              }}
                            >
                              📝 {r.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hidden print template */}
            <div ref={printRef} style={{ display: "none" }}>
              <h1>DAILY TIME RECORD</h1>
              <p className="sub">
                {selectedUser?.fullName} · {periodLabel}
              </p>
              <p className="sub">
                {selectedUser?.school}
                {selectedUser?.course ? ` · ${selectedUser.course}` : ""}
              </p>
              <div className="stats">
                <div className="stat">
                  <div className="stat-val" style={{ color: "#0098c0" }}>
                    {fmtHrs(totalMin)}
                  </div>
                  <div className="stat-lbl">Total Hours</div>
                </div>
                <div className="stat">
                  <div className="stat-val" style={{ color: "#16a34a" }}>
                    {present}
                  </div>
                  <div className="stat-lbl">Present</div>
                </div>
                <div className="stat">
                  <div className="stat-val" style={{ color: "#b45309" }}>
                    {late}
                  </div>
                  <div className="stat-lbl">Late</div>
                </div>
                <div className="stat">
                  <div className="stat-val" style={{ color: "#991b1b" }}>
                    {missing}
                  </div>
                  <div className="stat-lbl">Missing Logs</div>
                </div>
              </div>
              <hr />
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>AM In</th>
                    <th>AM Out</th>
                    <th>PM In</th>
                    <th>PM Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dtr.map((r) => {
                    const day = fmtDay(r.date);
                    return (
                      <tr key={r.id}>
                        <td className="date">
                          {day.wday}, {day.mon} {day.num}
                        </td>
                        <td>{fmtTime(r.amIn)}</td>
                        <td>
                          {r.amIn && !r.amOut ? "⚠️ Missing" : fmtTime(r.amOut)}
                        </td>
                        <td>{fmtTime(r.pmIn)}</td>
                        <td>
                          {r.pmIn && !r.pmOut ? "⚠️ Missing" : fmtTime(r.pmOut)}
                        </td>
                        <td className="hours">
                          {r.status === "missing_logs"
                            ? "—"
                            : fmtHrs(r.totalMinutes)}
                        </td>
                        <td>
                          <span className={`badge badge-${r.status}`}>
                            {r.status?.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "right",
                        color: "#1a2438",
                        fontWeight: 700,
                      }}
                    >
                      TOTAL HOURS RENDERED:
                    </td>
                    <td style={{ color: "#0098c0" }}>{fmtHrs(totalMin)}</td>
                    <td>{dtr.length} day(s)</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Selfie lightbox */}
      {selfieUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setSelfieUrl(null)}
        >
          <img
            src={selfieUrl}
            alt="selfie"
            className="max-w-xs max-h-[80vh] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
