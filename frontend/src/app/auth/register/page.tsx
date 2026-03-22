'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', gender: 'male', school: '', course: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      router.push('/auth/login?registered=1');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b12] flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 90% 80%, rgba(108,99,255,0.05) 0%, transparent 60%)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Create Account</h1>
          <p className="text-slate-500 text-sm">Join JuanHR v3</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input className="input" required placeholder="Juan dela Cruz" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input type="email" className="input" required placeholder="juan@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" required placeholder="Min 8 chars" minLength={8} value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">School (OJT)</label>
                <input className="input" placeholder="e.g. PLM Manila" value={form.school} onChange={e => set('school', e.target.value)} />
              </div>
              <div>
                <label className="label">Course (OJT)</label>
                <input className="input" placeholder="e.g. BSIT" value={form.course} onChange={e => set('course', e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
