import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  ArrowUpRight,
  TrendingUp,
  PieChart as PieIcon,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency, formatOrderStatus, formatDateTime } from '../utils/formatters';

const PIE_COLORS = ['#EAB308', '#38BDF8', '#10B981', '#F43F5E', '#A855F7', '#FB923C'];

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, chartsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts'),
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
          setTopProducts(statsRes.data.topProducts || []);
          setRecentOrders(statsRes.data.recentOrders || []);
          setLowStockItems(statsRes.data.lowStockItems || []);
        }

        if (chartsRes.data.success) {
          setCharts(chartsRes.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner if Low Stock Exists */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Omborda kam qolgan mahsulotlar bor!</p>
              <p className="text-xs text-amber-300">
                {lowStockItems.map((i: any) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
          >
            Omborga o'tish
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bugungi tushum"
          value={formatCurrency(stats?.todaySales)}
          subtitle="To'langan buyurtmalar bo'yicha"
          icon={DollarSign}
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          trend="+18%"
          trendUp={true}
        />
        <StatCard
          title="Bugungi buyurtmalar"
          value={stats?.todayOrdersCount || 0}
          subtitle={`O'rtacha chek: ${formatCurrency(stats?.averageCheck)}`}
          icon={ShoppingBag}
          iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />
        <StatCard
          title="Faol buyurtmalar"
          value={stats?.activeOrdersCount || 0}
          subtitle="Jarayondagi / tayyorlanayotgan"
          icon={Clock}
          iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
        />
        <StatCard
          title="Stollar bandligi"
          value={`${stats?.occupiedTablesCount || 0} / ${(stats?.emptyTablesCount || 0) + (stats?.occupiedTablesCount || 0)}`}
          subtitle={`${stats?.emptyTablesCount || 0} ta stol bo'sh, ${stats?.reservedTablesCount || 0} ta rezerv`}
          icon={Users}
          iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-[#121B2B] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Savdo Dinamikasi (Haftalik Tushum)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Oxirgi 7 kunlik umumiy tushum ko'rsatkichi</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
              Haftalik tahlil
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.weeklySales || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Tushum']}
                  labelFormatter={(lbl, p) => p[0]?.payload?.label || lbl}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#EAB308"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Distribution */}
        <div className="bg-[#121B2B] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-sky-400" />
              <span>Toifalar Bo'yicha Savdo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Kategoriyalar ulushi</p>
          </div>

          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.categorySales || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts?.categorySales || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Jami']}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products */}
        <div className="bg-[#121B2B] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Eng Ko'p Sotilgan Taomlar</span>
            </h3>
            <button
              onClick={() => navigate('/menu')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <span>Menyuga o'tish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Ma'lumotlar mavjud emas</p>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/20">
                      #{idx + 1}
                    </span>
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">{p.quantity} marta buyurtma qilingan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-400">{formatCurrency(p.revenue)}</p>
                    <p className="text-[10px] text-slate-400">tushum</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-[#121B2B] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <span>So'nggi Buyurtmalar</span>
            </h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <span>Barchasini ko'rish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Buyurtmalar mavjud emas</p>
            ) : (
              recentOrders.map((order) => {
                const statusMeta = formatOrderStatus(order.status);
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate('/orders')}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-amber-500/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                        {order.table?.number ? `S-${order.table.number}` : 'N/A'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            {order.orderNumber}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.color}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {order.waiter?.fullName} • {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{formatCurrency(order.finalAmount)}</p>
                      <p className="text-[10px] text-slate-400">{order.items?.length || 0} ta mahsulot</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
