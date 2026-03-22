"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { UserCheck, Plus, X, Pencil, Check } from "lucide-react";
import toast from "react-hot-toast";

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3001";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [ojts, setOjts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState({
    supervisorId: "",
    ojtId: "",
    scheduleId: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [a, sv, oj, sc] = await Promise.allSettled([
      api.get("/assignments"),
      api.get("/users?role=supervisor&limit=100"),
      api.get("/users?role=ojt&limit=100"),
      api.get("/schedules"),
    ]);
    if (a.status === "fulfilled") setAssignments(a.value.data || []);
    if (sv.status === "fulfilled") setSupervisors(sv.value.data.data || []);
    if (oj.status === "fulfilled") setOjts(oj.value.data.data || []);
    if (sc.status === "fulfilled") setSchedules(sc.value.data || []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Load each OJT's current schedule
  useEffect(() => {
    if (!assignments.length) return;
    assignments.forEach(async (a) => {
      if (!a.ojt?.id) return;
      try {
        const { data } = await api.get(`/schedules/ojt/${a.ojt.id}`);
        setAssignments((prev) =>
          prev.map((x) =>
            x.id === a.id ? { ...x, currentSchedule: data } : x,
          ),
        );
      } catch {}
    });
  }, [assignments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Assign supervisor
      await api.post("/assignments", {
        supervisorId: Number(form.supervisorId),
        ojtId: Number(form.ojtId),
      });
      // 2. Assign schedule if selected
      if (form.scheduleId) {
        await api.post("/schedules/assign", {
          ojtId: Number(form.ojtId),
          scheduleId: Number(form.scheduleId),
        });
      }
      toast.success("Assignment created!");
      setShowModal(false);
      setForm({ supervisorId: "", ojtId: "", scheduleId: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSupervisor = async (
    ojtId: number,
    supervisorId: string,
  ) => {
    if (!supervisorId) return;
    try {
      await api.post("/assignments", {
        supervisorId: Number(supervisorId),
        ojtId: Number(ojtId),
      });
      toast.success("Supervisor updated!");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleUpdateSchedule = async (ojtId: number, scheduleId: string) => {
    if (!scheduleId) return;
    try {
      await api.post("/schedules/assign", {
        ojtId: Number(ojtId),
        scheduleId: Number(scheduleId),
      });
      toast.success("Schedule updated!");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const parseWorkDays = (wd: string) => {
    try {
      return JSON.parse(wd).join(", ");
    } catch {
      return wd || "—";
    }
  };

  const assignedOjtIds = assignments.map((a) => a.ojt?.id);
  const unassigned = ojts.filter((o) => !assignedOjtIds.includes(o.id));

  return (
    <DashboardLayout title="Assignments" allowedRoles={["admin"]}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-slate-400 text-sm">
            Manage supervisor and schedule assignments for OJT employees.
          </p>
          <button
            onClick={() => {
              setForm({ supervisorId: "", ojtId: "", scheduleId: "" });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> New Assignment
          </button>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2740]">
                  <th className="table-header px-4 py-3 text-left">
                    OJT Employee
                  </th>
                  <th className="table-header px-4 py-3 text-left">
                    School / Course
                  </th>
                  <th className="table-header px-4 py-3 text-left">
                    Supervisor
                  </th>
                  <th className="table-header px-4 py-3 text-left">Schedule</th>
                  <th className="table-header px-4 py-3 text-left">
                    Work Days
                  </th>
                  <th className="table-header px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const isEditing = editRow === a.id;
                  const curScheduleId =
                    a.currentSchedule?.scheduleId ||
                    a.currentSchedule?.schedule?.id ||
                    "";
                  return (
                    <tr key={a.id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border border-[#1e2740] overflow-hidden bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
                            {a.ojt?.profileImage ? (
                              <img
                                src={`${API}${a.ojt.profileImage}`}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <span className="text-xs font-bold text-emerald-400">
                                {a.ojt?.fullName?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {a.ojt?.fullName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {a.ojt?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {a.ojt?.school || "—"}
                        <br />
                        <span className="text-slate-600">
                          {a.ojt?.course || ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="input text-xs py-1.5 w-44"
                            defaultValue={a.supervisor?.id}
                            onChange={(e) =>
                              handleUpdateSupervisor(a.ojt?.id, e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {supervisors.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.fullName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserCheck
                              size={13}
                              className="text-cyan-400 flex-shrink-0"
                            />
                            <span className="text-white">
                              {a.supervisor?.fullName || "—"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="input text-xs py-1.5 w-44"
                            defaultValue={curScheduleId}
                            onChange={(e) =>
                              handleUpdateSchedule(a.ojt?.id, e.target.value)
                            }
                          >
                            <option value="">No schedule</option>
                            {schedules.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        ) : a.currentSchedule?.schedule ? (
                          <span className="badge bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                            {a.currentSchedule.schedule.name}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">
                            No schedule
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {a.currentSchedule?.schedule
                          ? parseWorkDays(a.currentSchedule.schedule.workDays)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditRow(isEditing ? null : a.id)}
                          className={`p-1.5 rounded-lg transition-all ${isEditing ? "bg-emerald-400/10 text-emerald-400" : "hover:bg-cyan-400/10 text-slate-400 hover:text-cyan-400"}`}
                          title={isEditing ? "Done" : "Edit"}
                        >
                          {isEditing ? (
                            <Check size={13} />
                          ) : (
                            <Pencil size={13} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!assignments.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No assignments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {assignments.length > 0 && (
            <div className="px-4 py-3 border-t border-[#1e2740] text-xs text-slate-500">
              {assignments.length} assignment
              {assignments.length !== 1 ? "s" : ""} · Click ✏️ to edit inline
            </div>
          )}
        </div>

        {/* Unassigned warning */}
        {unassigned.length > 0 && (
          <div className="card border-yellow-400/20 bg-yellow-400/5">
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-lg">⚠️</span>
              <div>
                <div className="font-semibold text-yellow-400 text-sm mb-1">
                  {unassigned.length} OJT employee
                  {unassigned.length !== 1 ? "s" : ""} without a supervisor
                </div>
                <div className="text-xs text-slate-400">
                  {unassigned.map((o) => o.fullName).join(", ")}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Assignment Modal — includes schedule field */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={18} />
            </button>
            <h2 className="font-bold text-white text-lg mb-1">
              New Assignment
            </h2>
            <p className="text-slate-500 text-xs mb-5">
              Assign a supervisor and schedule to an OJT employee.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">OJT Employee</label>
                <select
                  className="input"
                  required
                  value={form.ojtId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ojtId: e.target.value }))
                  }
                >
                  <option value="">Select OJT employee...</option>
                  {ojts.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.fullName} — {o.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Supervisor</label>
                <select
                  className="input"
                  required
                  value={form.supervisorId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, supervisorId: e.target.value }))
                  }
                >
                  <option value="">Select supervisor...</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} — {s.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  Schedule{" "}
                  <span className="text-slate-600 normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <select
                  className="input"
                  value={form.scheduleId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, scheduleId: e.target.value }))
                  }
                >
                  <option value="">No schedule yet</option>
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
                        {s.name} ({s.amIn}–{s.amOut}) · {days}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saving..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
