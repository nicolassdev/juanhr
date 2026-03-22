"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { downloadExcel, downloadPdf } from "@/lib/download";
import toast from "react-hot-toast";
import {
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  BookOpen,
  GraduationCap,
  Building2,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const FILE_API = API.replace("/api/v1", "");

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

export default function SupervisorMyOjtPage() {
  const [ojts, setOjts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOjt, setSelectedOjt] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // DTR panel state
  const [dtr, setDtr] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [todayDtr, setTodayDtr] = useState<any>(null);
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [ojtSchedule, setOjtSchedule] = useState<any>(null);
  const [assigningSchedule, setAssigningSchedule] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  useEffect(() => {
    api
      .get("/assignments/my-ojt")
      .then(({ data }) => setOjts(data))
      .catch(() => {});
    api
      .get("/schedules")
      .then(({ data }) => setSchedules(data))
      .catch(() => {});
  }, []);

  const loadOjtData = async (ojtId: number) => {
    try {
      const [dtrRes, sumRes, schRes] = await Promise.allSettled([
        api.get(`/dtr/ojt/${ojtId}`, { params: { month, year } }),
        api.get(`/dtr/ojt/${ojtId}/summary`),
        api.get(`/schedules/ojt/${ojtId}`),
      ]);
      if (dtrRes.status === "fulfilled") {
        const records = dtrRes.value.data.records || [];
        setDtr(records);
        setTodayDtr(records.find((r: any) => isToday(r.date)) || null);
      }
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data);
      if (schRes.status === "fulfilled") setOjtSchedule(schRes.value.data);
    } catch {}
  };

  const openPanel = (ojt: any) => {
    setSelectedOjt(ojt);
    setPanelOpen(true);
    loadOjtData(ojt.id);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedOjt(null), 300);
  };

  useEffect(() => {
    if (selectedOjt) loadOjtData(selectedOjt.id);
  }, [month, year]);

  const assignSchedule = async () => {
    if (!selectedScheduleId || !selectedOjt) return;
    try {
      await api.post("/schedules/assign", {
        ojtId: Number(selectedOjt.id),
        scheduleId: Number(selectedScheduleId),
      });
      setAssigningSchedule(false);
      loadOjtData(selectedOjt.id);
    } catch {
      alert("Failed to assign schedule");
    }
  };

  const fmtTime = (d: string) =>
    d
      ? new Date(d).toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const fmtDate = (d: string) => {
    if (!d) return "—";
    const dt = new Date(d);
    return new Date(
      dt.getUTCFullYear(),
      dt.getUTCMonth(),
      dt.getUTCDate(),
    ).toLocaleDateString("en-PH", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };
  const fmtHrs = (min: number) =>
    min ? `${Math.floor(min / 60)}h ${min % 60}m` : "—";

  const filtered = ojts.filter(
    (a) =>
      !search || a.ojt?.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  const periodType = ojtSchedule?.schedule?.periodType || "two_period";

  const getTodayStatus = (dtr: any) => {
    if (!dtr) return { label: "No record", color: "var(--muted)", dot: "⚪" };
    if (dtr.amIn && !dtr.amOut)
      return { label: "Clocked In", color: "#22c55e", dot: "🟢" };
    if (dtr.amOut && periodType === "one_period")
      return { label: "Day Complete", color: "var(--accent)", dot: "✅" };
    if (dtr.amOut && !dtr.pmIn)
      return { label: "AM Done", color: "#f59e0b", dot: "🟡" };
    if (dtr.pmIn && !dtr.pmOut)
      return { label: "PM In Progress", color: "#f97316", dot: "🟠" };
    if (dtr.pmOut)
      return { label: "Day Complete", color: "var(--accent)", dot: "✅" };
    return { label: "No record", color: "var(--muted)", dot: "⚪" };
  };

  return (
    <DashboardLayout title="My OJT Employees" allowedRoles={["supervisor"]}>
      <div className="space-y-5">
        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}
            />
            <input
              className="input pl-9"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div
            className="card text-center py-16"
            style={{ color: "var(--muted)" }}
          >
            <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
            <p>No OJT employees assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((a: any) => {
              const ojt = a.ojt;
              const todStatus = getTodayStatus(null); // placeholder until individual today dtr loaded
              return (
                <OjtCard
                  key={a.id}
                  ojt={ojt}
                  assignment={a}
                  fileApi={FILE_API}
                  onClick={() => openPanel(ojt)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── SLIDE-IN DETAIL PANEL ── */}
      {/* Backdrop */}
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

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: "min(680px, 95vw)",
          background: "var(--card-bg)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {selectedOjt && (
          <>
            {/* Panel Header */}
            <div
              className="flex-shrink-0 p-5 border-b flex items-center gap-4"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl border-2 overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  borderColor: "var(--border)",
                  background:
                    "color-mix(in srgb, var(--accent) 12%, transparent)",
                }}
              >
                {selectedOjt.profileImage ? (
                  <img
                    src={`${FILE_API}${selectedOjt.profileImage}`}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <span
                    className="text-2xl font-black"
                    style={{ color: "var(--accent)" }}
                  >
                    {selectedOjt.fullName?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="font-black text-lg truncate"
                  style={{ color: "var(--text)" }}
                >
                  {selectedOjt.fullName}
                </h2>
                <div
                  className="text-xs mt-0.5 flex flex-wrap gap-x-3"
                  style={{ color: "var(--muted)" }}
                >
                  {selectedOjt.email && <span>{selectedOjt.email}</span>}
                  {selectedOjt.school && <span>🎓 {selectedOjt.school}</span>}
                  {selectedOjt.course && <span>📚 {selectedOjt.course}</span>}
                </div>
              </div>
              <button
                onClick={closePanel}
                className="p-2 rounded-xl transition-all flex-shrink-0"
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
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Summary stats */}
              {summary && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Total Hours",
                      val: `${summary.totalHours}h`,
                      color: "var(--accent)",
                    },
                    {
                      label: "Days Present",
                      val: summary.present,
                      color: "#22c55e",
                    },
                    { label: "Days Late", val: summary.late, color: "#f59e0b" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="card-sm text-center">
                      <div className="text-2xl font-black" style={{ color }}>
                        {val}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--muted)" }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Schedule info + assign */}
              <div className="card-sm flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} style={{ color: "var(--accent)" }} />
                  <div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {ojtSchedule?.schedule?.name || "No schedule assigned"}
                    </div>
                    {ojtSchedule?.schedule && (
                      <div
                        className="text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {ojtSchedule.schedule.amIn}–{ojtSchedule.schedule.amOut}
                        {ojtSchedule.schedule.pmIn &&
                          ` / ${ojtSchedule.schedule.pmIn}–${ojtSchedule.schedule.pmOut}`}
                        {" · "}
                        {(() => {
                          try {
                            return JSON.parse(
                              ojtSchedule.schedule.workDays,
                            ).join(", ");
                          } catch {
                            return "";
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAssigningSchedule(true);
                    setSelectedScheduleId(
                      String(ojtSchedule?.scheduleId || ""),
                    );
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--accent)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--muted)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border)";
                  }}
                >
                  {ojtSchedule ? "Change" : "Assign Schedule"}
                </button>
              </div>

              {/* Assign schedule inline */}
              {assigningSchedule && (
                <div
                  className="card-sm space-y-3 border"
                  style={{
                    borderColor: "var(--accent)",
                    borderStyle: "dashed",
                  }}
                >
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    Assign Schedule
                  </div>
                  <select
                    className="input"
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                  >
                    <option value="">Select schedule…</option>
                    {schedules.map((s) => {
                      const days = (() => {
                        try {
                          return JSON.parse(s.workDays).join(", ");
                        } catch {
                          return "";
                        }
                      })();
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.amIn}–{s.amOut} · {days}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAssigningSchedule(false)}
                      className="btn-outline flex-1 text-xs py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={assignSchedule}
                      className="btn-primary flex-1 text-xs py-2 justify-center"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Month/Year filter + Export */}
              <div className="flex flex-wrap gap-2 items-end justify-between">
                <div className="flex gap-2">
                  <div>
                    <label className="label">Month</label>
                    <select
                      className="input w-28"
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
                      className="input w-20"
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
                    onClick={async () => {
                      try {
                        await downloadExcel(
                          selectedOjt.id,
                          selectedOjt.fullName,
                          month,
                          year,
                        );
                      } catch {
                        toast.error("Download failed");
                      }
                    }}
                    className="btn-success flex items-center gap-1 text-xs px-3 py-2"
                  >
                    <FileSpreadsheet size={13} /> Excel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await downloadPdf(
                          selectedOjt.id,
                          selectedOjt.fullName,
                          month,
                          year,
                        );
                      } catch {
                        toast.error("Download failed");
                      }
                    }}
                    className="btn-danger flex items-center gap-1 text-xs px-3 py-2"
                  >
                    <FileText size={13} /> PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="btn-outline flex items-center gap-1 text-xs px-3 py-2"
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>

              {/* DTR Records — timeline style */}
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted)" }}
                >
                  DTR Records —{" "}
                  {new Date(+year, +month - 1).toLocaleString("en", {
                    month: "long",
                  })}{" "}
                  {year}
                </div>

                {dtr.length === 0 && (
                  <div
                    className="card-sm text-center py-8"
                    style={{ color: "var(--muted)" }}
                  >
                    No records for this period.
                  </div>
                )}

                <div className="space-y-2">
                  {dtr.map((r) => {
                    const isExpanded = expandedRecord === r.id;
                    const isRecordToday = isToday(r.date);
                    const hasSelfies =
                      r.amInSelfie ||
                      r.amOutSelfie ||
                      r.pmInSelfie ||
                      r.pmOutSelfie;

                    return (
                      <div
                        key={r.id}
                        className="rounded-2xl border overflow-hidden transition-all"
                        style={{
                          borderColor: isRecordToday
                            ? "var(--accent)"
                            : "var(--border)",
                          background: "var(--card-bg)",
                          boxShadow: isRecordToday
                            ? "0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent)"
                            : "none",
                        }}
                      >
                        {/* Record header row */}
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                          style={{
                            background: isRecordToday
                              ? "color-mix(in srgb, var(--accent) 6%, transparent)"
                              : "transparent",
                          }}
                          onClick={() =>
                            setExpandedRecord(isExpanded ? null : r.id)
                          }
                        >
                          {/* Date */}
                          <div className="flex-shrink-0 text-center w-12">
                            <div
                              className="text-lg font-black leading-none"
                              style={{
                                color: isRecordToday
                                  ? "var(--accent)"
                                  : "var(--text)",
                              }}
                            >
                              {new Date(
                                new Date(r.date).getUTCFullYear(),
                                new Date(r.date).getUTCMonth(),
                                new Date(r.date).getUTCDate(),
                              ).getDate()}
                            </div>
                            <div
                              className="text-[10px] uppercase"
                              style={{ color: "var(--muted)" }}
                            >
                              {new Date(
                                new Date(r.date).getUTCFullYear(),
                                new Date(r.date).getUTCMonth(),
                                new Date(r.date).getUTCDate(),
                              ).toLocaleString("en", { month: "short" })}
                            </div>
                          </div>

                          {/* Day name + status */}
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-semibold flex items-center gap-2"
                              style={{ color: "var(--text)" }}
                            >
                              {new Date(
                                new Date(r.date).getUTCFullYear(),
                                new Date(r.date).getUTCMonth(),
                                new Date(r.date).getUTCDate(),
                              ).toLocaleString("en", { weekday: "long" })}
                              {isRecordToday && (
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
                              className="text-xs mt-0.5 flex items-center gap-3 flex-wrap"
                              style={{ color: "var(--muted)" }}
                            >
                              {r.amIn && (
                                <span>
                                  In:{" "}
                                  <span style={{ color: "var(--text)" }}>
                                    {fmtTime(r.amIn)}
                                  </span>
                                </span>
                              )}
                              {r.amOut && (
                                <span>
                                  Out:{" "}
                                  <span style={{ color: "var(--text)" }}>
                                    {fmtTime(r.amOut || r.pmOut)}
                                  </span>
                                </span>
                              )}
                              {r.totalMinutes > 0 && (
                                <span style={{ color: "var(--accent)" }}>
                                  {fmtHrs(r.totalMinutes)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status badge */}
                          <span
                            className={`badge badge-${r.status} flex-shrink-0`}
                          >
                            {r.status}
                          </span>

                          {/* Expand arrow */}
                          <button
                            className="flex-shrink-0"
                            style={{ color: "var(--muted)" }}
                          >
                            {isExpanded ? (
                              <ChevronUp size={15} />
                            ) : (
                              <ChevronDown size={15} />
                            )}
                          </button>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div
                            className="px-4 pb-4 space-y-3"
                            style={{ borderTop: "1px solid var(--border)" }}
                          >
                            {/* Clock events timeline */}
                            <div className="space-y-2 pt-3">
                              {[
                                {
                                  label:
                                    periodType === "one_period"
                                      ? "Clock In"
                                      : "AM In",
                                  time: r.amIn,
                                  selfie: r.amInSelfie,
                                  type: "in",
                                },
                                {
                                  label:
                                    periodType === "one_period"
                                      ? "Clock Out"
                                      : "AM Out",
                                  time: r.amOut,
                                  selfie: r.amOutSelfie,
                                  type: "out",
                                },
                                ...(periodType === "two_period"
                                  ? [
                                      {
                                        label: "PM In",
                                        time: r.pmIn,
                                        selfie: r.pmInSelfie,
                                        type: "in",
                                      },
                                      {
                                        label: "PM Out",
                                        time: r.pmOut,
                                        selfie: r.pmOutSelfie,
                                        type: "out",
                                      },
                                    ]
                                  : []),
                              ].map(({ label, time, selfie, type }) => (
                                <div
                                  key={label}
                                  className="flex items-center gap-3"
                                >
                                  {/* Icon */}
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      background: time
                                        ? type === "in"
                                          ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                                          : "rgba(168,85,247,0.15)"
                                        : "var(--surface)",
                                    }}
                                  >
                                    <Clock
                                      size={13}
                                      style={{
                                        color: time
                                          ? type === "in"
                                            ? "var(--accent)"
                                            : "#a855f7"
                                          : "var(--muted)",
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <span
                                      className="text-xs font-medium"
                                      style={{ color: "var(--muted)" }}
                                    >
                                      {label}
                                    </span>
                                  </div>
                                  <span
                                    className="text-sm font-bold"
                                    style={{
                                      color: time
                                        ? "var(--text)"
                                        : "var(--muted)",
                                    }}
                                  >
                                    {fmtTime(time)}
                                  </span>
                                  {/* Selfie thumbnail */}
                                  {selfie && (
                                    <button
                                      onClick={() =>
                                        setSelfiePreview(`${FILE_API}${selfie}`)
                                      }
                                      className="w-8 h-8 rounded-lg overflow-hidden border flex-shrink-0 hover:opacity-80 transition-all"
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
                              ))}
                            </div>

                            {/* Notes */}
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
            </div>
          </>
        )}
      </div>

      {/* Selfie lightbox */}
      {selfiePreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setSelfiePreview(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={selfiePreview}
              alt="selfie"
              className="max-w-xs max-h-[80vh] rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setSelfiePreview(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/* ── OJT CARD COMPONENT ── */
function OjtCard({ ojt, assignment, fileApi, onClick }: any) {
  const getTodayDot = () => "⚪"; // would need separate API call per card

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:shadow-lg group"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")
      }
    >
      {/* Card top — avatar + info */}
      <div className="p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl border-2 overflow-hidden flex-shrink-0 flex items-center justify-center transition-all"
          style={{
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
          }}
        >
          {ojt?.profileImage ? (
            <img
              src={`${fileApi}${ojt.profileImage}`}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <span
              className="text-2xl font-black"
              style={{ color: "var(--accent)" }}
            >
              {ojt?.fullName?.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-bold text-base truncate"
            style={{ color: "var(--text)" }}
          >
            {ojt?.fullName}
          </div>
          <div
            className="text-xs truncate mt-0.5"
            style={{ color: "var(--muted)" }}
          >
            {ojt?.email}
          </div>
        </div>
      </div>

      {/* Card info row */}
      <div className="px-5 pb-5 space-y-2">
        {(ojt?.school || ojt?.course) && (
          <div
            className="flex items-start gap-4 text-xs flex-wrap"
            style={{ color: "var(--muted)" }}
          >
            {ojt?.school && (
              <span className="flex items-center gap-1">
                <Building2 size={11} /> {ojt.school}
              </span>
            )}
            {ojt?.course && (
              <span className="flex items-center gap-1">
                <BookOpen size={11} /> {ojt.course}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Assigned{" "}
            {new Date(assignment.assignedAt).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
            style={{
              background: "color-mix(in srgb, var(--accent) 10%, transparent)",
              color: "var(--accent)",
            }}
          >
            View DTR →
          </span>
        </div>
      </div>
    </div>
  );
}
