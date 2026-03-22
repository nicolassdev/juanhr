"use client";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import {
  Plus,
  Search,
  Lock,
  Unlock,
  Trash2,
  Pencil,
  X,
  Camera,
  Key,
  Shield,
  GraduationCap,
  UserCog,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth.store";

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3001";

const ROLES = [
  { id: 1, name: "admin", label: "Admin" },
  { id: 2, name: "supervisor", label: "Supervisor" },
  { id: 3, name: "ojt", label: "OJT" },
];

const roleIcon: Record<string, any> = {
  admin: Shield,
  supervisor: UserCog,
  ojt: GraduationCap,
};
const roleColor: Record<string, string> = {
  admin: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  supervisor: "text-cyan-600 bg-cyan-500/10 border-cyan-500/20",
  ojt: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
};

export default function AdminUsersPage() {
  const { user: me, updateUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [pwdUser, setPwdUser] = useState<any>(null);

  // Forms
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    gender: "male",
    school: "",
    course: "",
    roleId: "",
  });
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // Avatar upload
  const avatarRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [avatarTarget, setAvatarTarget] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users", {
        params: { search, limit: 100, role: roleFilter || undefined },
      });
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  /* ── CREATE / EDIT ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editUser) {
        const { password, ...rest } = form;
        await api.patch(`/users/${editUser.id}`, rest);
        toast.success("User updated!");
        setEditUser(null);
      } else {
        await api.post("/users", { ...form, roleId: Number(form.roleId) });
        toast.success("User created!");
        setShowCreate(false);
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── CHANGE PASSWORD ── */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await api.patch(`/users/${pwdUser.id}/password`, { password: newPwd });
      toast.success(`Password updated for ${pwdUser.fullName}`);
      setPwdUser(null);
      setNewPwd("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  /* ── DELETE / LOCK ── */
  const handleDelete = async (u: any) => {
    if (!confirm(`Delete ${u.fullName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  const handleLock = async (u: any) => {
    try {
      await api.patch(`/users/${u.id}/lock`);
      toast.success(
        u.isLocked ? `${u.fullName} unlocked` : `${u.fullName} locked`,
      );
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  const handleRoleChange = async (u: any, roleId: number) => {
    try {
      await api.patch(`/users/${u.id}/role`, { roleId });
      toast.success("Role changed");
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  /* ── AVATAR ── */
  const triggerAvatar = (userId: number) => {
    setAvatarTarget(userId);
    avatarRef.current?.click();
  };
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !avatarTarget) return;
    setUploadingFor(avatarTarget);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/users/${avatarTarget}/avatar`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (avatarTarget === me?.id)
        updateUser({ profileImage: data.profileImage });
      toast.success("Photo updated!");
      fetchUsers();
    } catch {
      toast.error("Upload failed. JPG/PNG only, max 5MB.");
    } finally {
      setUploadingFor(null);
      setAvatarTarget(null);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({
      fullName: u.fullName,
      email: u.email,
      password: "",
      gender: u.gender,
      school: u.school || "",
      course: u.course || "",
      roleId: String(u.role?.id || ""),
    });
  };

  const grouped = {
    admin: users.filter((u) => u.role?.name === "admin"),
    supervisor: users.filter((u) => u.role?.name === "supervisor"),
    ojt: users.filter((u) => u.role?.name === "ojt"),
  };

  return (
    <DashboardLayout title="Users" allowedRoles={["admin"]}>
      <input
        ref={avatarRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                className="input pl-9"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-36"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {total} users
            </span>
            <button
              onClick={() => {
                setEditUser(null);
                setForm({
                  fullName: "",
                  email: "",
                  password: "",
                  gender: "male",
                  school: "",
                  course: "",
                  roleId: "",
                });
                setShowCreate(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={15} /> Add User
            </button>
          </div>
        </div>

        {/* Cards grouped by role */}
        {(["admin", "supervisor", "ojt"] as const).map((role) => {
          const group = grouped[role];
          if (group.length === 0 && roleFilter && roleFilter !== role)
            return null;
          if (group.length === 0) return null;
          const Icon = roleIcon[role];
          return (
            <div key={role}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={15} className={roleColor[role].split(" ")[0]} />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--muted)" }}
                >
                  {role === "ojt"
                    ? "OJT Employees"
                    : role === "supervisor"
                      ? "Supervisors"
                      : "Administrators"}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full border ml-1"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  {group.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    roles={ROLES}
                    uploadingFor={uploadingFor}
                    onAvatar={() => triggerAvatar(u.id)}
                    onEdit={() => openEdit(u)}
                    onPassword={() => {
                      setPwdUser(u);
                      setNewPwd("");
                    }}
                    onLock={() => handleLock(u)}
                    onDelete={() => handleDelete(u)}
                    onRoleChange={(rid) => handleRoleChange(u, rid)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <div
            className="card text-center py-16"
            style={{ color: "var(--muted)" }}
          >
            No users found.
          </div>
        )}
      </div>

      {/* ── CREATE/EDIT MODAL ── */}
      {(showCreate || editUser) && (
        <Modal
          title={editUser ? `Edit — ${editUser.fullName}` : "New User"}
          onClose={() => {
            setShowCreate(false);
            setEditUser(null);
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input
                  className="input"
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">
                  Password{" "}
                  {editUser && (
                    <span
                      style={{
                        color: "var(--muted)",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                    >
                      (use key icon to change)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  className="input"
                  disabled={!!editUser}
                  minLength={8}
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder={
                    editUser ? "Use key button to change" : "Min 8 chars"
                  }
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  className="input"
                  value={form.gender}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gender: e.target.value }))
                  }
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={form.roleId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, roleId: e.target.value }))
                  }
                >
                  <option value="">Select role…</option>
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">School</label>
                <input
                  className="input"
                  value={form.school}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, school: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Course</label>
                <input
                  className="input"
                  value={form.course}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, course: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEditUser(null);
                }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {pwdUser && (
        <Modal
          title={`Change Password — ${pwdUser.fullName}`}
          onClose={() => setPwdUser(null)}
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div
              className="rounded-xl p-3 text-sm flex items-center gap-2 border"
              style={{
                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                borderColor:
                  "color-mix(in srgb, var(--accent) 25%, transparent)",
                color: "var(--accent)",
              }}
            >
              <Key size={14} /> Setting a new password for{" "}
              <strong>{pwdUser.fullName}</strong>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className="input pr-10"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted)" }}
                  onClick={() => setShowPwd((p) => !p)}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="mt-2 flex gap-1">
                {[4, 6, 8, 10].map((n) => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-all ${newPwd.length >= n ? "bg-cyan-400" : ""}`}
                    style={{
                      background:
                        newPwd.length >= n ? "var(--accent)" : "var(--border)",
                    }}
                  />
                ))}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {newPwd.length < 8
                  ? `${8 - newPwd.length} more characters needed`
                  : "✓ Strong enough"}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setPwdUser(null)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
              >
                <Key size={14} /> Update Password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}

/* ── USER CARD COMPONENT ── */
function UserCard({
  user: u,
  roles,
  uploadingFor,
  onAvatar,
  onEdit,
  onPassword,
  onLock,
  onDelete,
  onRoleChange,
}: any) {
  const API =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:3001";

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg group"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      {/* Card Header — avatar + name */}
      <div className="p-5 flex items-center gap-4">
        {/* Avatar */}
        <div
          className="relative flex-shrink-0 cursor-pointer"
          onClick={onAvatar}
          title="Click to change photo"
        >
          <div
            className="w-14 h-14 rounded-2xl border-2 overflow-hidden flex items-center justify-center"
            style={{
              borderColor: "var(--border)",
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            }}
          >
            {uploadingFor === u.id ? (
              <div
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--accent)" }}
              />
            ) : u.profileImage ? (
              <img
                src={`${API}${u.profileImage}`}
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
          {/* Hover overlay */}
          <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
            <Camera size={14} className="text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate" style={{ color: "var(--text)" }}>
            {u.fullName}
          </div>
          <div
            className="text-xs truncate mt-0.5"
            style={{ color: "var(--muted)" }}
          >
            {u.email}
          </div>
          {(u.school || u.course) && (
            <div
              className="text-xs truncate mt-0.5"
              style={{ color: "var(--muted)" }}
            >
              {u.school}
              {u.school && u.course ? " · " : ""}
              {u.course}
            </div>
          )}
        </div>
      </div>

      {/* Card Body — role + dept + status */}
      <div className="px-5 pb-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <select
            className="text-xs px-2 py-1.5 rounded-lg border font-medium transition-all"
            style={{
              background: "var(--input-bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            value={u.role?.id}
            onChange={(e) => onRoleChange(+e.target.value)}
          >
            {roles.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            {u.isLocked ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                Locked
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Active
              </span>
            )}
            {u.department?.name && (
              <span
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
              >
                {u.department.name}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex gap-1.5 pt-1 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <ActionBtn
            icon={Pencil}
            title="Edit user"
            onClick={onEdit}
            color="var(--accent)"
          />
          <ActionBtn
            icon={Key}
            title="Change password"
            onClick={onPassword}
            color="var(--accent4)"
          />
          <ActionBtn
            icon={u.isLocked ? Unlock : Lock}
            title={u.isLocked ? "Unlock account" : "Lock account"}
            onClick={onLock}
            color="#f59e0b"
          />
          <ActionBtn
            icon={Trash2}
            title="Delete user"
            onClick={onDelete}
            color="#ef4444"
          />
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, title, onClick, color }: any) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex-1 flex items-center justify-center py-2 rounded-lg transition-all text-xs gap-1"
      style={{ color: "var(--muted)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = color;
        (e.currentTarget as HTMLElement).style.background = `${color}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--muted)";
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <Icon size={14} />
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border relative"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="flex items-center justify-between p-6 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-bold text-lg" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-all"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--text)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--muted)")
            }
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
