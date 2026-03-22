"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import {
  Plus,
  Trash2,
  X,
  Pencil,
  Clock,
  CalendarDays,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EMPTY_FORM = {
  name: "",
  periodType: "one_period",
  amIn: "08:00",
  amOut: "12:00",
  pmIn: "13:00",
  pmOut: "17:00",
  workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  graceMinutes: 15,
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<any>(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  const load = () =>
    api
      .get("/schedules")
      .then(({ data }) => setSchedules(data))
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const toggleDay = (d: string) =>
    set(
      "workDays",
      form.workDays.includes(d)
        ? form.workDays.filter((x: string) => x !== d)
        : [...form.workDays, d],
    );

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };
  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      periodType: s.periodType,
      amIn: s.amIn,
      amOut: s.amOut,
      pmIn: s.pmIn || "13:00",
      pmOut: s.pmOut || "17:00",
      workDays: (() => {
        try {
          return JSON.parse(s.workDays);
        } catch {
          return [];
        }
      })(),
      graceMinutes: s.graceMinutes ?? 15,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.workDays.length === 0) {
      toast.error("Select at least one work day");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/schedules/${editId}`, form);
        toast.success("Schedule updated!");
      } else {
        await api.post("/schedules", form);
        toast.success("Schedule created!");
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/schedules/${deleteTarget.id}`);
      toast.success("Schedule deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const fmtTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hr = +h;
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  return (
    <DashboardLayout title="Schedules" allowedRoles={["admin"]}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {schedules.length} schedule{schedules.length !== 1 ? "s" : ""} total
          </p>
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> New Schedule
          </button>
        </div>

        {schedules.length === 0 && (
          <div
            className="card text-center py-16"
            style={{ color: "var(--muted)" }}
          >
            <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
            <p>No schedules yet. Create one to get started.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((s) => {
            const days: string[] = (() => {
              try {
                return JSON.parse(s.workDays || "[]");
              } catch {
                return [];
              }
            })();
            const isTwo = s.periodType === "two_period";
            return (
              <div
                key={s.id}
                className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
                style={{
                  background: "var(--card-bg)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3
                        className="font-black text-base leading-tight"
                        style={{ color: "var(--text)" }}
                      >
                        {s.name}
                      </h3>
                      <span
                        className="inline-flex items-center gap-1 mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{
                          background:
                            "color-mix(in srgb, var(--accent) 10%, transparent)",
                          color: "var(--accent)",
                          border:
                            "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                        }}
                      >
                        <Clock size={10} /> {isTwo ? "2 Period" : "1 Period"}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(s)}
                        title="Edit"
                        className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
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
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({ id: s.id, name: s.name })
                        }
                        title="Delete"
                        className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
                        style={{
                          borderColor: "var(--border)",
                          color: "var(--muted)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "#ef4444";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--muted)";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--border)";
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span>🌅</span>
                      <span style={{ color: "var(--muted)" }}>
                        {isTwo ? "AM:" : "Hours:"}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {fmtTime(s.amIn)} – {fmtTime(s.amOut)}
                      </span>
                    </div>
                    {isTwo && s.pmIn && (
                      <div className="flex items-center gap-2 text-sm">
                        <span>🌇</span>
                        <span style={{ color: "var(--muted)" }}>PM:</span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          {fmtTime(s.pmIn)} – {fmtTime(s.pmOut)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span>⏱</span>
                      <span style={{ color: "var(--muted)" }}>Grace:</span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {s.graceMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <div className="flex gap-1 mt-3">
                    {DAYS.map((d) => (
                      <div
                        key={d}
                        className="flex-1 text-center py-1 rounded-lg text-[10px] font-bold"
                        style={{
                          background: days.includes(d)
                            ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                            : "var(--surface)",
                          color: days.includes(d)
                            ? "var(--accent)"
                            : "var(--muted)",
                          border: `1px solid ${days.includes(d) ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--border)"}`,
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border flex flex-col"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow)",
              maxHeight: "90vh", // never taller than viewport
            }}
          >
            {/* Fixed header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <h2
                className="font-black text-lg flex items-center gap-2"
                style={{ color: "var(--text)" }}
              >
                {editId ? (
                  <>
                    <Pencil size={16} style={{ color: "var(--accent)" }} /> Edit
                    Schedule
                  </>
                ) : (
                  <>
                    <Plus size={16} style={{ color: "var(--accent)" }} /> New
                    Schedule
                  </>
                )}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "var(--muted)")
                }
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="label">Schedule Name</label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Standard 8–5"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>

              {/* Period type */}
              <div>
                <label className="label">Period Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      val: "one_period",
                      label: "1 Period",
                      desc: "No break — single clock-in/out",
                    },
                    {
                      val: "two_period",
                      label: "2 Period",
                      desc: "AM + PM with lunch break",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => set("periodType", opt.val)}
                      className="rounded-xl p-3 border text-left transition-all"
                      style={{
                        borderColor:
                          form.periodType === opt.val
                            ? "var(--accent)"
                            : "var(--border)",
                        background:
                          form.periodType === opt.val
                            ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                            : "var(--surface)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {form.periodType === opt.val && (
                          <CheckCircle
                            size={12}
                            style={{ color: "var(--accent)" }}
                          />
                        )}
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              form.periodType === opt.val
                                ? "var(--accent)"
                                : "var(--text)",
                          }}
                        >
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* AM time */}
              <div>
                <label className="label">
                  {form.periodType === "one_period"
                    ? "Working Hours"
                    : "AM Period"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="label"
                      style={{ textTransform: "none", letterSpacing: 0 }}
                    >
                      Start
                    </label>
                    <input
                      type="time"
                      className="input"
                      value={form.amIn}
                      onChange={(e) => set("amIn", e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="label"
                      style={{ textTransform: "none", letterSpacing: 0 }}
                    >
                      End
                    </label>
                    <input
                      type="time"
                      className="input"
                      value={form.amOut}
                      onChange={(e) => set("amOut", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* PM time */}
              {form.periodType === "two_period" && (
                <div>
                  <label className="label">PM Period</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="label"
                        style={{ textTransform: "none", letterSpacing: 0 }}
                      >
                        Start
                      </label>
                      <input
                        type="time"
                        className="input"
                        value={form.pmIn}
                        onChange={(e) => set("pmIn", e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        className="label"
                        style={{ textTransform: "none", letterSpacing: 0 }}
                      >
                        End
                      </label>
                      <input
                        type="time"
                        className="input"
                        value={form.pmOut}
                        onChange={(e) => set("pmOut", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Grace */}
              <div>
                <label className="label">Grace Period (minutes)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={form.graceMinutes}
                    onChange={(e) => set("graceMinutes", +e.target.value)}
                    className="flex-1"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <div
                    className="w-14 text-center rounded-lg py-1.5 text-sm font-bold border"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--accent)",
                    }}
                  >
                    {form.graceMinutes}m
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  Clock-ins within {form.graceMinutes} min of start are marked
                  Present (not Late)
                </p>
              </div>

              {/* Work days */}
              <div>
                <label className="label">
                  Work Days&nbsp;
                  <span
                    style={{
                      color:
                        form.workDays.length === 0 ? "#ef4444" : "var(--muted)",
                      textTransform: "none",
                      letterSpacing: 0,
                      fontWeight: 400,
                    }}
                  >
                    ({form.workDays.length} selected)
                  </span>
                </label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={{
                        background: form.workDays.includes(d)
                          ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                          : "var(--surface)",
                        borderColor: form.workDays.includes(d)
                          ? "color-mix(in srgb, var(--accent) 40%, transparent)"
                          : "var(--border)",
                        color: form.workDays.includes(d)
                          ? "var(--accent)"
                          : "var(--muted)",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed footer */}
            <div
              className="flex gap-2 justify-end px-6 py-4 border-t flex-shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "var(--bg)" }}
                    />{" "}
                    Saving…
                  </>
                ) : editId ? (
                  <>
                    <CheckCircle size={14} /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Create Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border overflow-hidden"
            style={{
              background: "var(--card-bg)",
              borderColor: "#ef444440",
              boxShadow: "var(--shadow)",
            }}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <h3
                className="font-black text-lg"
                style={{ color: "var(--text)" }}
              >
                Delete Schedule
              </h3>
              <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
                You're about to delete{" "}
                <span className="font-bold" style={{ color: "var(--text)" }}>
                  "{deleteTarget.name}"
                </span>
                .
              </p>
              <div
                className="mt-3 rounded-xl p-3 text-xs border"
                style={{
                  background: "rgba(239,68,68,0.05)",
                  borderColor: "rgba(239,68,68,0.2)",
                  color: "#f87171",
                }}
              >
                ⚠️ OJT employees assigned to this schedule will lose their
                schedule and won't be able to clock in until a new one is
                assigned.
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
