"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      setAuth(data.user, data.accessToken);
      const role = data.user.role;
      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "supervisor") router.push("/supervisor/dashboard");
      else router.push("/ojt/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#080b12] flex items-center justify-center p-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 10% 20%, rgba(0,212,255,0.05) 0%, transparent 60%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/20 px-4 py-2 rounded-full mb-4">
            <span className="text-cyan-400 text-sm font-semibold">
              JuanHR v3
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-slate-500 text-sm">OJT HR & Attendance System</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                placeholder="admin@juanhr.com"
                className="input"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-4">
            No account?{" "}
            <Link
              href="/auth/register"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
