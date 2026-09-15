import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  BookOpen,
  CreditCard,
  Warehouse,
  Users,
  CalendarDays,
  UserCheck,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  Coffee,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRole } from '../../utils/formatters';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMINISTRATOR'] },
    { name: 'Stollar', path: '/tables', icon: UtensilsCrossed, roles: ['ADMINISTRATOR', 'OFITSIANT', 'KASSIR'] },
    { name: 'Buyurtmalar', path: '/orders', icon: ShoppingBag, roles: ['ADMINISTRATOR', 'OFITSIANT', 'KASSIR'] },
    { name: 'Menyu', path: '/menu', icon: BookOpen, roles: ['ADMINISTRATOR', 'OFITSIANT', 'KASSIR', 'OMBORCHI'] },
    { name: 'Kassa va To\'lov', path: '/cashier', icon: CreditCard, roles: ['ADMINISTRATOR', 'KASSIR'] },
    { name: 'Ombor', path: '/inventory', icon: Warehouse, roles: ['ADMINISTRATOR', 'OMBORCHI'] },
    { name: 'Mijozlar', path: '/customers', icon: Users, roles: ['ADMINISTRATOR', 'OFITSIANT', 'KASSIR'] },
    { name: 'Rezervatsiyalar', path: '/reservations', icon: CalendarDays, roles: ['ADMINISTRATOR', 'OFITSIANT', 'KASSIR'] },
    { name: 'Xodimlar', path: '/staff', icon: UserCheck, roles: ['ADMINISTRATOR'] },
    { name: 'Hisobotlar', path: '/reports', icon: BarChart3, roles: ['ADMINISTRATOR'] },
    { name: 'Audit Log', path: '/audit-logs', icon: ShieldAlert, roles: ['ADMINISTRATOR'] },
    { name: 'Sozlamalar', path: '/settings', icon: Settings, roles: ['ADMINISTRATOR'] },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.some((r) => hasRole(r as any))
  );

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 font-extrabold text-xl">
          <Coffee className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-lg tracking-wider text-white">VEGAS</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold tracking-widest uppercase">
              CAFE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Boshqaruv Tizimi</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-black' : 'text-slate-400 group-hover:text-amber-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#121B2B] border border-slate-800">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
              {user?.fullName.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-amber-400 font-medium truncate">
                {user ? formatRole(user.role) : ''}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Chiqish"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
