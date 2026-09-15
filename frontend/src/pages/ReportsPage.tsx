import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Users,
  Flame,
  Award,
} from 'lucide-react';
import api from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/sales', {
        params: { period },
      });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handleExportCSV = async () => {
    try {
      window.open('/api/reports/export/csv', '_blank');
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Period Selector */}
        <div className="flex items-center space-x-1.5 p-1 bg-[#121B2B] border border-slate-800 rounded-2xl">
          {[
            { id: 'daily', label: 'Bugun' },
            { id: 'weekly', label: 'Haftalik' },
            { id: 'monthly', label: 'Oylik' },
            { id: 'yearly', label: 'Yillik' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === item.id
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Export & Print */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Excel (CSV) Yuklash</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish (PDF)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Davr bo'yicha tushum"
          value={formatCurrency(data?.summary?.totalRevenue)}
          subtitle="Jami yopilgan to'lovlar"
          icon={DollarSign}
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        />
        <StatCard
          title="Buyurtmalar soni"
          value={`${data?.summary?.totalOrders || 0} ta`}
          subtitle={`O'rtacha chek: ${formatCurrency(data?.summary?.averageCheck)}`}
          icon={BarChart3}
          iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />
        <StatCard
          title="Naqd savdo"
          value={formatCurrency(data?.summary?.cashTotal)}
          subtitle="Kassadagi naqd pul"
          icon={Banknote}
          iconColor="text-sky-400 bg-sky-500/10 border-sky-500/20"
        />
        <StatCard
          title="Karta orqali savdo"
          value={formatCurrency(data?.summary?.cardTotal)}
          subtitle="Terminal / Humo / Uzcard"
          icon={CreditCard}
          iconColor="text-purple-400 bg-purple-500/10 border-purple-500/20"
        />
      </div>

      {/* Performance Grid: Waiters and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiter Performance */}
        <div className="bg-[#121B2B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Ofitsiantlar Bo'yicha Savdo</span>
            </h3>
            <span className="text-xs text-slate-400">Xodimlar reytingi</span>
          </div>

          <div className="space-y-3">
            {(!data?.waiterPerformance || data.waiterPerformance.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">Ma'lumotlar yo'q</p>
            ) : (
              data.waiterPerformance.map((w: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                        idx === 0
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{w.name}</h4>
                      <p className="text-[11px] text-slate-400">{w.ordersCount} ta buyurtma yopgan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-amber-400">
                      {formatCurrency(w.totalSales)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Sold Products */}
        <div className="bg-[#121B2B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Eng Ko'p Sotilgan Taomlar</span>
            </h3>
            <span className="text-xs text-slate-400">Top 10 talik</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {(!data?.topProducts || data.topProducts.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">Ma'lumotlar yo'q</p>
            ) : (
              data.topProducts.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {p.quantity} {p.category} sotilgan
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-white">{formatCurrency(p.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Financial Transactions List */}
      <div className="bg-[#121B2B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">To'langan Buyurtmalar Jurnali</h3>
          <span className="text-xs text-slate-400">So'nggi qabul qilingan to'lovlar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">Chek ID</th>
                <th className="py-3 px-4 font-bold">Buyurtma</th>
                <th className="py-3 px-4 font-bold">Stol</th>
                <th className="py-3 px-4 font-bold">Ofitsiant</th>
                <th className="py-3 px-4 font-bold">To'lov Turi</th>
                <th className="py-3 px-4 font-bold text-right">Summa</th>
                <th className="py-3 px-4 font-bold">Sana va Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(!data?.recentPayments || data.recentPayments.length === 0) ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    To'lovlar topilmadi
                  </td>
                </tr>
              ) : (
                data.recentPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-400">#{p.id}</td>
                    <td className="py-2.5 px-4 font-bold text-amber-400">{p.order?.orderNumber}</td>
                    <td className="py-2.5 px-4 text-white">Stol {p.order?.table?.number}</td>
                    <td className="py-2.5 px-4 text-slate-300">{p.order?.waiter?.fullName}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {p.paymentMethod === 'CASH' ? 'Naqd' : 'Karta'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-white">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{formatDateTime(p.paidAt)}</td>
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
