"use client";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/api";
import { Camera, Save } from "lucide-react";
import toast from "react-hot-toast";

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3001";

export default function OjtProfilePage() {
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ school: "", course: "" });
  const [summary, setSummary] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log("USER:", user);
    if (user) {
      setForm({
        school: (user as any).school || "",
        course: (user as any).course || "",
      });
      setPreviewUrl(user.profileImage ? `${API}${user.profileImage}` : null);
    }
    api
      .get("/dtr/me/summary")
      .then(({ data }) => setSummary(data))
      .catch(() => {});
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/users/${user?.id}/profile`, form);
      updateUser(form);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/users/${user?.id}/avatar`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Update store so sidebar + topbar reflect new photo immediately
      updateUser({ profileImage: data.profileImage });
      setPreviewUrl(`${API}${data.profileImage}`);
      toast.success("Photo updated!");
    } catch {
      setPreviewUrl(user?.profileImage ? `${API}${user.profileImage}` : null);
      toast.error("Upload failed. Must be JPG/PNG under 5MB.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout title="My Profile" allowedRoles={["ojt"]}>
      <div className="max-w-2xl space-y-6">
        {/* Avatar + Name */}
        <div className="card flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-2 border-cyan-400/30 overflow-hidden bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-cyan-400">
                  {user?.fullName?.charAt(0)}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-full flex items-center justify-center transition-all shadow-lg"
              title="Upload photo"
            >
              {uploading ? (
                <div className="w-3 h-3 border border-[#080b12] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={13} className="text-[#080b12]" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]);
              }}
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{user?.fullName}</h2>
            <div className="text-sm text-slate-400 mt-0.5">{user?.email}</div>
            <span className="badge badge-ojt mt-2 inline-block">
              OJT Employee
            </span>
            <p className="text-xs text-slate-600 mt-2">
              Click the camera icon to upload your photo
            </p>
          </div>
        </div>

        {/* Read-only Info */}
        <div className="card space-y-4">
          <h3 className="font-bold text-white">Account Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <div className="input bg-[#0a0f1a] text-slate-500 cursor-not-allowed select-none">
                {user?.fullName}
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="input bg-[#0a0f1a] text-slate-500 cursor-not-allowed select-none">
                {user?.email}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            ⚠️ Full name and email can only be changed by your Admin.
          </p>
        </div>

        {/* Editable School Info */}
        <div className="card">
          <h3 className="font-bold text-white mb-4">School Information</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">School / University</label>
              <input
                className="input"
                placeholder="e.g. Pamantasan ng Lungsod ng Maynila"
                value={form.school}
                onChange={(e) =>
                  setForm((p) => ({ ...p, school: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Course / Program</label>
              <input
                className="input"
                placeholder="e.g. BS Information Technology"
                value={form.course}
                onChange={(e) =>
                  setForm((p) => ({ ...p, course: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* DTR Summary */}
        {summary && (
          <div className="card">
            <h3 className="font-bold text-white mb-4">My Attendance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Total Hours",
                  val: `${summary.totalHours}h`,
                  color: "text-cyan-400",
                },
                {
                  label: "Days Present",
                  val: summary.present,
                  color: "text-emerald-400",
                },
                {
                  label: "Days Late",
                  val: summary.late,
                  color: "text-yellow-400",
                },
                {
                  label: "Total Days",
                  val: summary.totalDays,
                  color: "text-violet-400",
                },
              ].map(({ label, val, color }) => (
                <div
                  key={label}
                  className="bg-[#0e1220] rounded-xl p-3 border border-[#1e2740] text-center"
                >
                  <div className={`text-2xl font-black ${color}`}>{val}</div>
                  <div className="text-xs text-slate-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
