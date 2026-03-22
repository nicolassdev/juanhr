'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Plus, Trash2, Pencil, X, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetch = () => api.get('/departments').then(({ data }) => setDepts(data)).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDept) { await api.put(`/departments/${editDept.id}`, form); toast.success('Updated'); }
      else { await api.post('/departments', form); toast.success('Created'); }
      setShowModal(false); fetch();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete department?')) return;
    try { await api.delete(`/departments/${id}`); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  return (
    <DashboardLayout title="Departments" allowedRoles={['admin']}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setEditDept(null); setForm({ name: '', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add Department</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map(d => (
            <div key={d.id} className="card flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
                  <Building2 size={18} className="text-orange-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">{d.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{d.description || 'No description'}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditDept(d); setForm({ name: d.name, description: d.description || '' }); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-cyan-400/10 text-slate-400 hover:text-cyan-400"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-400/10 text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {!depts.length && <p className="text-slate-500">No departments yet.</p>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={18} /></button>
            <h2 className="font-bold text-white text-lg mb-5">{editDept ? 'Edit Department' : 'New Department'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">Name</label><input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
