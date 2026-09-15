import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  Activity,
} from 'lucide-react';
import api from '../api/client';
import { AuditLog } from '../types';
import { formatDateTime } from '../utils/formatters';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs', {
        params: {
          search: search || undefined,
          action: actionFilter,
        },
      });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CREATE_ORDER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'UPDATE_ORDER':
      case 'UPDATE_ORDER_STATUS':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'PAYMENT_RECEIVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'INVENTORY_TRANSACTION':
      case 'CREATE_INVENTORY':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CREATE_STAFF':
      case 'UPDATE_STAFF':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tafsilotlar bo'yicha qidiruv..."
              className="w-full pl-9 pr-4 py-2 bg-[#121B2B] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-[#121B2B] border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Barcha harakatlar</option>
            <option value="LOGIN">Tizimga kirish</option>
            <option value="CREATE_ORDER">Buyurtma yaratish</option>
            <option value="UPDATE_ORDER_STATUS">Buyurtma holati</option>
            <option value="PAYMENT_RECEIVED">To'lov qabul qilish</option>
            <option value="INVENTORY_TRANSACTION">Ombor operatsiyasi</option>
            <option value="CREATE_STAFF">Xodim qo'shish</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Jami qaydlar: {logs.length} ta
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-[#121B2B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Vaqt va Sana</th>
                <th className="py-3.5 px-4 font-bold">Foydalanuvchi</th>
                <th className="py-3.5 px-4 font-bold">Harakat Turi</th>
                <th className="py-3.5 px-4 font-bold">Tafsilotlar</th>
                <th className="py-3.5 px-4 font-bold text-right">IP Manzil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Audit yozuvlari topilmadi
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{log.user.fullName}</span>
                          <span className="text-[10px] text-amber-400">({log.user.role})</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Tizim</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {log.details || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
