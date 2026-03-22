"use client";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { downloadExcel, downloadPdf } from "@/lib/download";
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  User,
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

export default function SupervisorDtrPage() {
  const [ojts, setOjts] = useState<any[]>([]);
  const [selectedOjt, setSelectedOjt] = useState<any>(null);
  const [dtr, setDtr] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [dlLoading, setDlLoading] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get("/assignments/my-ojt")
      .then(({ data }) => setOjts(data))
      .catch(() => {});
  }, []);

  const loadDtr = async (ojtId: number) => {
    try {
      const [d, s] = await Promise.all([
        api.get(`/dtr/ojt/${ojtId}`, { params: { month, year } }),
        api.get(`/dtr/ojt/${ojtId}/summary`),
      ]);
      setDtr(d.data.records || []);
      setSummary(s.data);
    } catch {
      setDtr([]);
      setSummary(null);
    }
  };

  const selectOjt = (ojt: any) => {
    setSelectedOjt(ojt);
    loadDtr(ojt.id);
  };

  useEffect(() => {
    if (selectedOjt) loadDtr(selectedOjt.id);
  }, [month, year]);

  /* ── Download handlers ─────────────────────────── */
  const handleExcel = async () => {
    if (!selectedOjt) return;
    setDlLoading("excel");
    try {
      await downloadExcel(selectedOjt.id, selectedOjt.fullName, month, year);
    } catch {
      toast.error("Excel download failed");
    } finally {
      setDlLoading(null);
    }
  };

  const handlePdf = async () => {
    if (!selectedOjt) return;
    setDlLoading("pdf");
    try {
      await downloadPdf(selectedOjt.id, selectedOjt.fullName, month, year);
    } catch {
      toast.error("PDF download failed");
    } finally {
      setDlLoading(null);
    }
  };

  /* ── Print handler ─────────────────────────────── */
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DTR — ${selectedOjt?.fullName}</title>
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
          thead th { color: #00d4ff; padding: 7px 8px; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          tbody tr:nth-child(even) { background: #f5f9fc; }
          td { padding: 6px 8px; text-align: center; border-bottom: 1px solid #eee; }
          td.date { text-align: left; font-weight: 600; }
          td.hours { color: #0098c0; font-weight: 700; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 700; }
          .badge-present { background: #dcfce7; color: #166534; }
          .badge-late    { background: #fef3c7; color: #92400e; }
          .badge-absent  { background: #fee2e2; color: #991b1b; }
          tfoot td { font-weight: 900; padding: 10px 8px; background: #e8f4f8; color: #0098c0; font-size: 13px; text-align: center; }
          .footer { margin-top: 24px; font-size: 9px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  /* ── Formatters ─────────────────────────────────── */
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

  const filtered = ojts.filter(
    (a) =>
      !search || a.ojt?.fullName?.toLowerCase().includes(search.toLowerCase()),
  );
  const totalMin = dtr.reduce((s, r) => s + (r.totalMinutes || 0), 0);
  const present = dtr.filter((r) => r.status === "present").length;
  const late = dtr.filter((r) => r.status === "late").length;
  const periodLabel = new Date(+year, +month - 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });

  return (
    <DashboardLayout title="DTR Monitor" allowedRoles={["supervisor"]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Employee Card List ── */}
        <div className="space-y-3">
          <div className="relative">
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
          <div className="space-y-2">
            {filtered.map((a: any) => {
              const sel = selectedOjt?.id === a.ojt?.id;
              return (
                <div
                  key={a.id}
                  onClick={() => selectOjt(a.ojt)}
                  className="rounded-2xl border overflow-hidden cursor-pointer transition-all"
                  style={{
                    background: sel
                      ? "color-mix(in srgb, var(--accent) 8%, var(--card-bg))"
                      : "var(--card-bg)",
                    borderColor: sel ? "var(--accent)" : "var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    if (!sel)
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "color-mix(in srgb, var(--accent) 50%, var(--border))";
                  }}
                  onMouseLeave={(e) => {
                    if (!sel)
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--border)";
                  }}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div
                      className="w-11 h-11 rounded-xl border overflow-hidden flex-shrink-0 flex items-center justify-center"
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
                          className="text-base font-black"
                          style={{ color: "var(--accent)" }}
                        >
                          {a.ojt?.fullName?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-sm truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {a.ojt?.fullName}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: "var(--muted)" }}
                      >
                        {a.ojt?.course || a.ojt?.email}
                      </div>
                    </div>
                    {sel && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {!filtered.length && (
              <div
                className="card text-center py-8"
                style={{ color: "var(--muted)" }}
              >
                <User size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No employees found.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── DTR Panel ── */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedOjt ? (
            <div
              className="card flex flex-col items-center justify-center py-16"
              style={{ color: "var(--muted)" }}
            >
              <Clock size={40} className="mb-3 opacity-30" />
              <p>Select an employee to view their DTR</p>
            </div>
          ) : (
            <>
              {/* Controls card */}
              <div className="card space-y-4">
                {/* Employee header */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: "var(--border)",
                      background:
                        "color-mix(in srgb, var(--accent) 10%, transparent)",
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
                        className="text-xl font-black"
                        style={{ color: "var(--accent)" }}
                      >
                        {selectedOjt.fullName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: "var(--text)" }}>
                      {selectedOjt.fullName}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {selectedOjt.school} · {selectedOjt.course}
                    </div>
                  </div>
                </div>

                {/* Month/Year + Buttons */}
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
                      <FileSpreadsheet size={13} />
                      {dlLoading === "excel" ? "Downloading…" : "Excel"}
                    </button>
                    <button
                      onClick={handlePdf}
                      disabled={dlLoading === "pdf"}
                      className="btn-danger flex items-center gap-1 text-xs px-3 py-2"
                    >
                      <FileText size={13} />
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

                {/* Summary chips */}
                <div
                  className="grid grid-cols-4 gap-2 pt-2"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {[
                    {
                      label: "Total Hours",
                      val: fmtHrs(totalMin),
                      color: "var(--accent)",
                    },
                    { label: "Present", val: present, color: "#22c55e" },
                    { label: "Late", val: late, color: "#f59e0b" },
                    { label: "Days", val: dtr.length, color: "var(--text)" },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      className="rounded-xl p-2.5 text-center"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
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
              </div>

              {/* DTR record cards */}
              <div className="space-y-2">
                {dtr.length === 0 && (
                  <div
                    className="card text-center py-10"
                    style={{ color: "var(--muted)" }}
                  >
                    No DTR records for this period.
                  </div>
                )}
                {dtr.map((r) => {
                  const day = fmtDay(r.date);
                  const isExp = expandedId === r.id;
                  const today = isToday(r.date);
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border overflow-hidden transition-all"
                      style={{
                        borderColor: today ? "var(--accent)" : "var(--border)",
                        background: "var(--card-bg)",
                      }}
                    >
                      {/* Header row */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                        style={{
                          background: today
                            ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                            : "transparent",
                        }}
                        onClick={() => setExpandedId(isExp ? null : r.id)}
                      >
                        <div className="w-11 text-center flex-shrink-0">
                          <div
                            className="text-xl font-black leading-none"
                            style={{
                              color: today ? "var(--accent)" : "var(--text)",
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
                            className="text-sm font-semibold flex items-center gap-2"
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
                            className="text-xs mt-0.5 flex gap-4"
                            style={{ color: "var(--muted)" }}
                          >
                            {r.amIn && (
                              <span>
                                ⏩ In:{" "}
                                <b style={{ color: "var(--text)" }}>
                                  {fmtTime(r.amIn)}
                                </b>
                              </span>
                            )}
                            {(r.amOut || r.pmOut) && (
                              <span>
                                ⏹ Out:{" "}
                                <b style={{ color: "var(--text)" }}>
                                  {fmtTime(r.pmOut || r.amOut)}
                                </b>
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Hours pill */}
                        <div
                          className="rounded-xl px-3 py-1.5 font-black text-sm flex-shrink-0"
                          style={{
                            background: r.totalMinutes
                              ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                              : "var(--surface)",
                            color: r.totalMinutes
                              ? "var(--accent)"
                              : "var(--muted)",
                          }}
                        >
                          {fmtHrs(r.totalMinutes)}
                        </div>
                        <span
                          className={`badge badge-${r.status} flex-shrink-0`}
                        >
                          {r.status}
                        </span>
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

                      {/* Expanded */}
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
                            },
                            {
                              label: "Clock Out (AM)",
                              time: r.amOut,
                              selfie: r.amOutSelfie,
                              type: "out",
                            },
                            {
                              label: "Clock In (PM)",
                              time: r.pmIn,
                              selfie: r.pmInSelfie,
                              type: "in",
                            },
                            {
                              label: "Clock Out (PM)",
                              time: r.pmOut,
                              selfie: r.pmOutSelfie,
                              type: "out",
                            },
                          ]
                            .filter((e) => e.time)
                            .map(({ label, time, selfie, type }) => (
                              <div
                                key={label}
                                className="flex items-center gap-3 py-2 rounded-xl px-3"
                                style={{ background: "var(--surface)" }}
                              >
                                <div
                                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                                  style={{
                                    background:
                                      type === "in"
                                        ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                                        : "rgba(168,85,247,0.15)",
                                  }}
                                >
                                  <Clock
                                    size={12}
                                    style={{
                                      color:
                                        type === "in"
                                          ? "var(--accent)"
                                          : "#a855f7",
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-xs font-medium flex-1"
                                  style={{ color: "var(--muted)" }}
                                >
                                  {label}
                                </span>
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: "var(--text)" }}
                                >
                                  {fmtTime(time)}
                                </span>
                                {selfie && (
                                  <button
                                    onClick={() =>
                                      setSelfieUrl(`${FILE_API}${selfie}`)
                                    }
                                    className="w-9 h-9 rounded-lg overflow-hidden border flex-shrink-0 hover:opacity-80 transition-all"
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
                          {r.totalMinutes > 0 && (
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
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Hidden print template ── */}
      <div ref={printRef} style={{ display: "none" }}>
        <h1>DAILY TIME RECORD</h1>
        <p className="sub">
          {selectedOjt?.fullName} &nbsp;·&nbsp; {periodLabel}
        </p>
        <p className="sub">
          {selectedOjt?.school}{" "}
          {selectedOjt?.course ? `· ${selectedOjt.course}` : ""}
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
            <div className="stat-val">{dtr.length}</div>
            <div className="stat-lbl">Total Days</div>
          </div>
        </div>
        <hr />
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>PM In</th>
              <th>PM Out</th>
              <th>Total Hours</th>
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
                  <td>{fmtTime(r.amOut)}</td>
                  <td>{fmtTime(r.pmIn)}</td>
                  <td>{fmtTime(r.pmOut)}</td>
                  <td className="hours">{fmtHrs(r.totalMinutes)}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>
                      {r.status?.toUpperCase()}
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
        <div className="footer">
          Generated by JuanHR v3 · {new Date().toLocaleString("en-PH")}
        </div>
      </div>

      {/* Selfie lightbox */}
      {selfieUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
