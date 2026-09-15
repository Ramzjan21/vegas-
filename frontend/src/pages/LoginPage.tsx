import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Login va parolni kiriting.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative luxury background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-xl shadow-amber-500/25 mb-4 transform hover:scale-105 transition-transform">
            <Coffee className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            VEGAS <span className="text-amber-400">CAFE</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Boshqaruv Axborot Tizimi (Diplom Ishi)</p>
        </div>

        {/* Login Form Box */}
        <div className="bg-[#121B2B] border border-slate-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-2">Tizimga kirish</h2>
          <p className="text-xs text-slate-400 mb-6">
            O'z login va maxfiy parolingiz orqali tizimga kiring
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Foydalanuvchi logini
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masalan: admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Maxfiy parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Login Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-3 text-center">
              Diplom himoyasi uchun demo hisoblar:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">👑</span>
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Admin
                  </p>
                </div>
                <p className="text-[10px] text-slate-400">admin / admin123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ofitsiant1', 'waiter123')}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">🍽️</span>
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Ofitsiant
                  </p>
                </div>
                <p className="text-[10px] text-slate-400">ofitsiant1 / waiter123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('kassir1', 'cashier123')}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">💳</span>
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Kassir
                  </p>
                </div>
                <p className="text-[10px] text-slate-400">kassir1 / cashier123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('omborchi1', 'stock123')}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">📦</span>
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Omborchi
                  </p>
                </div>
                <p className="text-[10px] text-slate-400">omborchi1 / stock123</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Vegas Cafe Management System. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
};
