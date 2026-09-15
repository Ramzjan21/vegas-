import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Users,
  Filter,
} from 'lucide-react';
import api from '../api/client';
import { Reservation, Table } from '../types';
import { Modal } from '../components/common/Modal';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Add Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '+998 ',
    tableId: '',
    guestsCount: '2',
    reservationDate: new Date().toISOString().split('T')[0],
    reservationTime: '19:00',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRes, tablesRes] = await Promise.all([
        api.get('/reservations', {
          params: {
            status: statusFilter,
            date: dateFilter || undefined,
          },
        }),
        api.get('/tables'),
      ]);

      if (resRes.data.success) setReservations(resRes.data.reservations);
      if (tablesRes.data.success) {
        setTables(tablesRes.data.tables);
        if (!formData.tableId && tablesRes.data.tables.length > 0) {
          setFormData((prev) => ({ ...prev, tableId: tablesRes.data.tables[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, dateFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.tableId) {
      alert('Ism, telefon va stol tanlanishi shart.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/reservations', formData);
      if (res.data.success) {
        setShowModal(false);
        setFormData({
          customerName: '',
          customerPhone: '+998 ',
          tableId: tables[0]?.id.toString() || '',
          guestsCount: '2',
          reservationDate: new Date().toISOString().split('T')[0],
          reservationTime: '19:00',
          notes: '',
        });
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Kutilmoqda', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'CONFIRMED':
        return { label: 'Tasdiqlangan', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'COMPLETED':
        return { label: 'Yakunlangan', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'CANCELLED':
        return { label: 'Bekor qilingan', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      default:
        return { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-[#121B2B] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#121B2B] border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Barcha holatlar</option>
            <option value="CONFIRMED">Tasdiqlangan</option>
            <option value="PENDING">Kutilmoqda</option>
            <option value="COMPLETED">Yakunlangan</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-amber-400 hover:underline"
            >
              Sanani tozalash
            </button>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-extrabold rounded-xl flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yangi rezervatsiya</span>
        </button>
      </div>

      {/* Reservations Table */}
      <div className="bg-[#121B2B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Mijoz</th>
                <th className="py-3.5 px-4 font-bold">Telefon</th>
                <th className="py-3.5 px-4 font-bold">Stol</th>
                <th className="py-3.5 px-4 font-bold">Sana va Vaqt</th>
                <th className="py-3.5 px-4 font-bold text-center">Mehmonlar</th>
                <th className="py-3.5 px-4 font-bold">Holati</th>
                <th className="py-3.5 px-4 font-bold">Izoh</th>
                <th className="py-3.5 px-4 font-bold text-center">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Rezervatsiyalar mavjud emas
                  </td>
                </tr>
              ) : (
                reservations.map((res) => {
                  const statusInfo = getStatusBadge(res.status);
                  return (
                    <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{res.customerName}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{res.customerPhone}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-bold text-white">
                          {res.table?.number}-stol ({res.table?.section})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {res.reservationDate} • <strong className="text-amber-400">{res.reservationTime}</strong>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {res.guestsCount} kishi
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{res.notes || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={res.status}
                          onChange={(e) => handleUpdateStatus(res.id, e.target.value)}
                          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white focus:outline-none focus:border-amber-400 font-semibold"
                        >
                          <option value="CONFIRMED">Tasdiqlangan</option>
                          <option value="PENDING">Kutilmoqda</option>
                          <option value="COMPLETED">Yakunlangan</option>
                          <option value="CANCELLED">Bekor qilish</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reservation Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Yangi Stol Rezervatsiyasi"
          maxWidth="md"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mijoz ismi
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Masalan: Bobur Mansurov"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Telefon raqami
              </label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+998 90 123 45 67"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Stol tanlash
                </label>
                <select
                  value={formData.tableId}
                  onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-bold"
                  required
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.number}-stol ({t.section}, {t.capacity} kishilik)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mehmonlar soni
                </label>
                <input
                  type="number"
                  value={formData.guestsCount}
                  onChange={(e) => setFormData({ ...formData, guestsCount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sana
                </label>
                <input
                  type="date"
                  value={formData.reservationDate}
                  onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Vaqt
                </label>
                <input
                  type="time"
                  value={formData.reservationTime}
                  onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Izoh yoki maxsus talablar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Masalan: Shamlar bilan bezatilgan dasturxon..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              />
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
                {submitting ? 'Saqlanmoqda...' : 'Band qilish'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
