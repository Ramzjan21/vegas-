import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, Check, ShieldAlert, Sparkles, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRole, formatDateTime } from '../../utils/formatters';

export const Navbar: React.FC<{ pageTitle?: string }> = ({ pageTitle = 'Boshqaruv Paneli' }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'NEW_ORDER':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'PAYMENT':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'RESERVATION':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <header className="h-16 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-wide">{pageTitle}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center space-x-4">
        {/* Live Clock */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/50">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {currentTime.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })},{' '}
            {currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700/60"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#121B2B] border border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white">Bildirishnomalar</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} ta yangi
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-slate-400 hover:text-amber-400 flex items-center space-x-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Barchasi o'qildi</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Bildirishnomalar mavjud emas
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 transition-colors flex items-start space-x-3 ${
                        n.isRead ? 'bg-transparent opacity-75' : 'bg-amber-500/5'
                      }`}
                    >
                      <div className={`p-2 rounded-xl border shrink-0 ${getNotifColor(n.type)}`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-snug">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          title="O'qildi deb belgilash"
                          className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-extrabold text-xs shadow-md shadow-amber-500/20">
            {user?.fullName.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white leading-tight">{user?.fullName}</p>
            <p className="text-[10px] text-amber-400 font-medium">
              {user ? formatRole(user.role) : ''}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
