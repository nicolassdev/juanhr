"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import Webcam from "react-webcam";
import {
  Camera,
  CheckCircle,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import { downloadExcelMe, downloadPdfMe } from "@/lib/download";
import { useAuthStore } from "@/stores/auth.store";

type Step = "idle" | "camera" | "preview" | "submitting" | "done";

// Compare dates in LOCAL timezone — avoids UTC offset bugs
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

type PeriodType = "one_period" | "two_period";

interface Schedule {
  id: number;
  name: string;
  periodType: PeriodType;
  amIn: string;
  amOut: string;
  pmIn?: string;
  pmOut?: string;
  workDays: string[];
  graceMinutes: number;
}

interface NextAction {
  action: "clock-in" | "clock-out";
  label: string;
  step: "am-in" | "am-out" | "pm-in" | "pm-out";
  isDone: boolean;
}

function getNextAction(dtr: any | null, periodType: PeriodType): NextAction {
  if (!dtr || !dtr.amIn)
    return {
      action: "clock-in",
      label: "Clock In",
      step: "am-in",
      isDone: false,
    };
  if (dtr.amIn && !dtr.amOut)
    return {
      action: "clock-out",
      label: "Clock Out",
      step: "am-out",
      isDone: false,
    };
  if (periodType === "one_period")
    return {
      action: "clock-out",
      label: "Day Complete",
      step: "am-out",
      isDone: true,
    };
  if (!dtr.pmIn)
    return {
      action: "clock-in",
      label: "Clock In (PM)",
      step: "pm-in",
      isDone: false,
    };
  if (!dtr.pmOut)
    return {
      action: "clock-out",
      label: "Clock Out (PM)",
      step: "pm-out",
      isDone: false,
    };
  return {
    action: "clock-out",
    label: "Day Complete",
    step: "pm-out",
    isDone: true,
  };
}

export default function OjtDtrPage() {
  const { user } = useAuthStore();
  const webcamRef = useRef<Webcam>(null);
  const [step, setStep] = useState<Step>("idle");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [todayDtr, setTodayDtr] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [cameraError, setCameraError] = useState(false);

  // Report state
  const [reportMonth, setReportMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [reportYear, setReportYear] = useState(
    String(new Date().getFullYear()),
  );
  const [reportData, setReportData] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  const loadSchedule = async () => {
    setScheduleLoading(true);
    try {
      const { data } = await api.get("/dtr/me/schedule");
      setSchedule(data);
    } catch {
      setSchedule(null);
    } finally {
      setScheduleLoading(false);
    }
  };

  const loadDtr = async () => {
    try {
      const now = new Date();
      const { data } = await api.get("/dtr/me", {
        params: { month: now.getMonth() + 1, year: now.getFullYear() },
      });
      const records: any[] = data.records || [];
      setTodayDtr(records.find((r) => isToday(r.date)) || null);
      setHistory(records);
    } catch {}
  };

  useEffect(() => {
    loadSchedule();
    loadDtr();
  }, []);

  const periodType: PeriodType = schedule?.periodType || "one_period";
  const {
    action,
    label: actionLabel,
    step: actionStep,
    isDone,
  } = getNextAction(todayDtr, periodType);
  const hasSchedule = !!schedule;

  const capture = useCallback(() => {
    const img = webcamRef.current?.getScreenshot();
    if (img) {
      setCapturedImg(img);
      setStep("preview");
    }
  }, [webcamRef]);

  const base64ToBlob = (b64: string): Blob => {
    const [, d] = b64.split(",");
    const mime = b64.split(";")[0].split(":")[1];
    const bytes = atob(d);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleSubmit = async () => {
    if (!capturedImg) return;
    setStep("submitting");
    try {
      const fd = new FormData();
      fd.append("selfie", base64ToBlob(capturedImg), "selfie.jpg");
      if (notes) fd.append("notes", notes);
      await api.post(`/dtr/${action}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`✅ ${actionLabel} recorded!`);
      setStep("done");
      setCapturedImg(null);
      setNotes("");
      await loadDtr();
      setTimeout(() => setStep("idle"), 1800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed. Try again.");
      setStep("idle");
    }
  };

  const loadReport = async () => {
    try {
      const { data } = await api.get("/dtr/me", {
        params: { month: +reportMonth, year: +reportYear },
      });
      setReportData(data);
      setShowReport(true);
    } catch {
      toast.error("Failed to load report");
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
    ).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };
  const fmtHrs = (min: number) =>
    min ? `${Math.floor(min / 60)}h ${min % 60}m` : "—";

  // Build the time slot boxes depending on period type
  const timeBoxes =
    periodType === "one_period"
      ? [
          {
            label: "Clock In",
            val: todayDtr?.amIn,
            color: "text-cyan-400",
            border: "border-cyan-400/20",
            isNext: actionStep === "am-in",
          },
          {
            label: "Clock Out",
            val: todayDtr?.amOut,
            color: "text-violet-400",
            border: "border-violet-400/20",
            isNext: actionStep === "am-out",
          },
        ]
      : [
          {
            label: "AM In",
            val: todayDtr?.amIn,
            color: "text-cyan-400",
            border: "border-cyan-400/20",
            isNext: actionStep === "am-in",
          },
          {
            label: "AM Out",
            val: todayDtr?.amOut,
            color: "text-violet-400",
            border: "border-violet-400/20",
            isNext: actionStep === "am-out",
          },
          {
            label: "PM In",
            val: todayDtr?.pmIn,
            color: "text-orange-400",
            border: "border-orange-400/20",
            isNext: actionStep === "pm-in",
          },
          {
            label: "PM Out",
            val: todayDtr?.pmOut,
            color: "text-emerald-400",
            border: "border-emerald-400/20",
            isNext: actionStep === "pm-out",
          },
        ];

  const displayHistory = showReport ? reportData?.records || [] : history;

  return (
    <DashboardLayout title="Daily Time Record" allowedRoles={["ojt"]}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Clock Panel */}
        <div className="space-y-4">
          {/* Schedule Info Banner */}
          {scheduleLoading ? (
            <div className="card flex items-center gap-3 border-[#1e2740]">
              <div className="w-4 h-4 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-500 text-sm">
                Loading schedule...
              </span>
            </div>
          ) : !hasSchedule ? (
            <div className="card border-yellow-400/30 bg-yellow-400/5">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="text-yellow-400 flex-shrink-0 mt-0.5"
                />
                <div>
                  <div className="font-semibold text-yellow-400 text-sm">
                    No Schedule Assigned
                  </div>
                  <div className="text-slate-400 text-xs mt-1">
                    You cannot clock in or out until your supervisor assigns a
                    schedule to you. Please contact your supervisor.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-cyan-400/20 bg-cyan-400/5">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={16}
                  className="text-cyan-400 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">
                    {schedule.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      {periodType === "one_period" ? "1 Period" : "2 Period"} ·{" "}
                      {schedule.amIn}–{schedule.amOut}
                      {schedule.pmIn && ` / ${schedule.pmIn}–${schedule.pmOut}`}
                    </span>
                    <span className="text-slate-500">
                      {schedule.workDays.join(", ")}
                    </span>
                    <span className="text-slate-500">
                      Grace: {schedule.graceMinutes} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Today's Time Record boxes */}
          <div className="card">
            <h2 className="font-bold text-white mb-4 text-sm">
              Today's Time Record
            </h2>
            <div
              className={`grid gap-3 ${periodType === "one_period" ? "grid-cols-2" : "grid-cols-2"}`}
            >
              {timeBoxes.map(({ label, val, color, border, isNext }) => (
                <div
                  key={label}
                  className={`rounded-xl p-3 border ${border} ${val ? "bg-[#0e1220]" : isNext && hasSchedule ? "bg-[#0e1220] border-dashed" : "bg-[#090d18]"}`}
                >
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    {label}
                    {isNext && hasSchedule && !isDone && (
                      <span className="text-[10px] text-cyan-400 animate-pulse">
                        ● next
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-mono font-bold text-sm ${val ? color : "text-slate-700"}`}
                  >
                    {fmtTime(val)}
                  </div>
                </div>
              ))}
            </div>
            {todayDtr && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className={`badge badge-${todayDtr.status}`}>
                  {todayDtr.status}
                </span>
                {todayDtr.totalMinutes > 0 && (
                  <span className="text-xs text-slate-500">
                    {fmtHrs(todayDtr.totalMinutes)} rendered
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Clock Action Panel */}
          <div className="card">
            {/* NO SCHEDULE — disabled state */}
            {!hasSchedule && !scheduleLoading && (
              <div className="text-center py-8">
                <AlertTriangle
                  size={40}
                  className="text-yellow-400 mx-auto mb-3 opacity-60"
                />
                <p className="text-slate-400 font-semibold">
                  Clock-in Disabled
                </p>
                <p className="text-slate-600 text-sm mt-1">
                  Waiting for supervisor to assign a schedule.
                </p>
              </div>
            )}

            {/* HAS SCHEDULE — normal flow */}
            {hasSchedule && (
              <>
                {step === "idle" && (
                  <div className="text-center">
                    {isDone ? (
                      <div className="py-6">
                        <CheckCircle
                          size={48}
                          className="text-emerald-400 mx-auto mb-3"
                        />
                        <p className="text-white font-bold text-lg">
                          Day Complete! 🎉
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                          {periodType === "one_period"
                            ? "Your 1-period record is done."
                            : "Both periods complete."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`text-5xl font-black mb-3 ${action === "clock-in" ? "text-cyan-400" : "text-violet-400"}`}
                        >
                          {action === "clock-in" ? "🟢" : "🔴"}
                        </div>
                        <h3 className="font-bold text-white text-xl mb-1">
                          {actionLabel}
                        </h3>
                        <p className="text-slate-500 text-sm mb-5">
                          {action === "clock-in"
                            ? "Take a selfie to record your arrival."
                            : "Take a selfie to record your departure."}
                        </p>
                        <button
                          onClick={() => {
                            setCameraError(false);
                            setStep("camera");
                          }}
                          className="btn-primary flex items-center gap-2 mx-auto"
                        >
                          <Camera size={16} /> Open Camera
                        </button>
                      </>
                    )}
                  </div>
                )}

                {step === "camera" && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-white mb-2">
                      📸 {actionLabel} — smile!
                    </div>
                    {cameraError ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-400 text-sm">
                        Camera unavailable. Please allow camera access in your
                        browser settings.
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-[#1e2740]">
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="w-full"
                          onUserMediaError={() => setCameraError(true)}
                          mirrored
                        />
                      </div>
                    )}
                    <div>
                      <label className="label">Notes (optional)</label>
                      <input
                        className="input"
                        placeholder="Any remarks..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStep("idle")}
                        className="btn-outline flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={capture}
                        disabled={cameraError}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Camera size={15} /> Capture
                      </button>
                    </div>
                  </div>
                )}

                {step === "preview" && capturedImg && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-white mb-2">
                      Preview — looks good?
                    </div>
                    <img
                      src={capturedImg}
                      alt="preview"
                      className="w-full rounded-xl border border-[#1e2740]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCapturedImg(null);
                          setStep("camera");
                        }}
                        className="btn-outline flex-1 flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={14} /> Retake
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={14} /> Confirm {actionLabel}
                      </button>
                    </div>
                  </div>
                )}

                {step === "submitting" && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white font-semibold">
                      Recording {actionLabel}...
                    </p>
                  </div>
                )}

                {step === "done" && (
                  <div className="text-center py-8">
                    <CheckCircle
                      size={48}
                      className="text-emerald-400 mx-auto mb-3"
                    />
                    <p className="text-white font-bold text-lg">Submitted!</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {actionLabel} recorded.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT — DTR History + Report */}
        <div className="space-y-4">
          {/* Report Filter */}
          <div className="card">
            <h2 className="font-bold text-white text-sm mb-3">DTR Report</h2>
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="label">Month</label>
                <select
                  className="input w-32"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
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
                  className="input w-24"
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                >
                  {[2023, 2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={loadReport}
                className="btn-outline text-xs px-3 py-2.5"
              >
                View
              </button>
              {showReport && (
                <button
                  onClick={() => {
                    setShowReport(false);
                  }}
                  className="text-xs text-slate-500 hover:text-cyan-400 px-2 py-2.5"
                >
                  ← Current
                </button>
              )}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={async () => {
                  try {
                    await downloadExcelMe(
                      user?.fullName || "OJT",
                      reportMonth,
                      reportYear,
                    );
                  } catch {
                    toast.error("Download failed");
                  }
                }}
                className="btn-success flex items-center gap-1.5 text-xs px-3 py-2"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button
                onClick={async () => {
                  try {
                    await downloadPdfMe(
                      user?.fullName || "OJT",
                      reportMonth,
                      reportYear,
                    );
                  } catch {
                    toast.error("Download failed");
                  }
                }}
                className="btn-danger flex items-center gap-1.5 text-xs px-3 py-2"
              >
                <FileText size={13} /> PDF
              </button>
              <button
                onClick={() => window.print()}
                className="btn-outline flex items-center gap-1.5 text-xs px-3 py-2"
              >
                <Printer size={13} /> Print
              </button>
            </div>
          </div>

          {/* DTR Table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2740] flex items-center justify-between">
              <h2 className="font-bold text-white text-sm">
                {showReport
                  ? `${new Date(+reportYear, +reportMonth - 1).toLocaleString("en", { month: "long" })} ${reportYear}`
                  : "This Month's DTR"}
              </h2>
            </div>
            {showReport && reportData && (
              <div className="px-4 py-2 border-b border-[#1e2740] flex gap-4 flex-wrap text-xs">
                <span className="text-slate-500">
                  Total:{" "}
                  <span className="text-cyan-400 font-bold">
                    {fmtHrs(reportData.totalMinutes)}
                  </span>
                </span>
                <span className="text-slate-500">
                  Days:{" "}
                  <span className="text-white font-bold">
                    {reportData.records?.length}
                  </span>
                </span>
                <span className="text-slate-500">
                  Present:{" "}
                  <span className="text-emerald-400 font-bold">
                    {
                      reportData.records?.filter(
                        (r: any) => r.status === "present",
                      ).length
                    }
                  </span>
                </span>
                <span className="text-slate-500">
                  Late:{" "}
                  <span className="text-yellow-400 font-bold">
                    {
                      reportData.records?.filter(
                        (r: any) => r.status === "late",
                      ).length
                    }
                  </span>
                </span>
              </div>
            )}
            <div className="overflow-y-auto max-h-[480px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0e1220]">
                  <tr className="border-b border-[#1e2740]">
                    <th className="table-header px-3 py-3 text-left">Date</th>
                    {periodType === "one_period" ? (
                      <>
                        <th className="table-header px-3 py-3 text-left">In</th>
                        <th className="table-header px-3 py-3 text-left">
                          Out
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="table-header px-3 py-3 text-left">
                          AM In
                        </th>
                        <th className="table-header px-3 py-3 text-left">
                          AM Out
                        </th>
                        <th className="table-header px-3 py-3 text-left">
                          PM In
                        </th>
                        <th className="table-header px-3 py-3 text-left">
                          PM Out
                        </th>
                      </>
                    )}
                    <th className="table-header px-3 py-3 text-left">Hours</th>
                    <th className="table-header px-3 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayHistory.map((r: any) => (
                    <tr key={r.id} className="table-row">
                      <td className="px-3 py-2.5 text-slate-300 font-medium text-xs">
                        {fmtDate(r.date)}
                      </td>
                      {periodType === "one_period" ? (
                        <>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">
                            {fmtTime(r.amIn)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">
                            {fmtTime(r.amOut)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">
                            {fmtTime(r.amIn)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">
                            {fmtTime(r.amOut)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">
                            {fmtTime(r.pmIn)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">
                            {fmtTime(r.pmOut)}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2.5 text-cyan-400 font-semibold text-xs">
                        {fmtHrs(r.totalMinutes)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`badge badge-${r.status} text-xs`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!displayHistory.length && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No records for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
