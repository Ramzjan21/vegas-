import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Shield,
  Phone,
  Lock,
  User,
  Power,
} from 'lucide-react';
import api from '../api/client';
import { User as StaffUser, UserRole } from '../types';
import { Modal } from '../components/common/Modal';
import { formatRole, formatDateTime } from '../utils/formatters';

export const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'OFITSIANT' as UserRole,
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff', {
        params: {
          search: search || undefined,
          role: roleFilter,
        },
      });
      if (res.data.success) {
        setStaff(res.data.staff);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search, roleFilter]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      fullName: '',
      username: '',
      password: '',
      role: 'OFITSIANT',
      phone: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: StaffUser) => {
    setEditingStaff(user);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      password: '',
      role: user.role,
      phone: user.phone || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.role) {
      alert('Ism va lavozim kiritilishi shart.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, {
          fullName: formData.fullName,
          role: formData.role,
          phone: formData.phone,
          password: formData.password || undefined,
        });
      } else {
        if (!formData.username || !formData.password) {
          alert('Login va parol kiritilishi shart.');
          return;
        }
        await api.post('/staff', formData);
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: StaffUser) => {
    try {
      await api.patch(`/staff/${user.id}/toggle-status`);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Holatni o\'zgartirishda xatolik');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'OFITSIANT':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'KASSIR':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'OMBORCHI':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Xodim ismi yoki telefoni..."
              className="w-full pl-9 pr-4 py-2 bg-[#121B2B] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#121B2B] border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Barcha lavozimlar</option>
            <option value="ADMINISTRATOR">Administrator</option>
            <option value="OFITSIANT">Ofitsiant</option>
            <option value="KASSIR">Kassir</option>
            <option value="OMBORCHI">Omborchi</option>
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-extrabold rounded-xl flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yangi xodim qo'shish</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-[#121B2B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Xodim</th>
                <th className="py-3.5 px-4 font-bold">Login</th>
                <th className="py-3.5 px-4 font-bold">Lavozim</th>
                <th className="py-3.5 px-4 font-bold">Telefon</th>
                <th className="py-3.5 px-4 font-bold text-center">Holati</th>
                <th className="py-3.5 px-4 font-bold">Qo'shilgan sana</th>
                <th className="py-3.5 px-4 font-bold text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Xodimlar topilmadi
                  </td>
                </tr>
              ) : (
                staff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-sm">
                          {user.fullName.charAt(0)}
                        </div>
                        <span className="font-bold text-white">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">@{user.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getRoleBadge(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{user.phone || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {user.isActive ? 'Faol' : 'Faolsiz'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDateTime(user.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isActive
                              ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white'
                              : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black'
                          }`}
                          title={user.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingStaff ? 'Xodim Ma\'lumotlarini Tahrirlash' : 'Yangi Xodim Qo\'shish'}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ism va familiya
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Masalan: Jasur Aliyev"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {!editingStaff && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tizimga kirish logini (username)
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Masalan: ofitsiant3"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {editingStaff ? 'Yangi parol (agar o\'zgartirmoqchi bo\'lsangiz)' : 'Maxfiy parol'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                required={!editingStaff}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lavozim / Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="OFITSIANT">Ofitsiant</option>
                  <option value="KASSIR">Kassir</option>
                  <option value="OMBORCHI">Omborchi</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Telefon raqam
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
