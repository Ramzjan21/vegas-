import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Boshqaruv Paneli (Dashboard)',
  '/tables': 'Stollar Xaritasi va Bandligi',
  '/orders': 'Buyurtmalar Ro\'yxati',
  '/menu': 'Menyu va Mahsulotlar Boshqaruvi',
  '/cashier': 'Kassa va To\'lovlarni Qabul Qilish',
  '/inventory': 'Omborxona va Xom-ashyo Zaxirasi',
  '/customers': 'Doimiy Mijozlar Bazasi',
  '/reservations': 'Stollarni Rezervatsiya Qilish',
  '/staff': 'Xodimlar va Foydalanuvchilar',
  '/reports': 'Moliyaviy va Savdo Hisobotlari',
  '/audit-logs': 'Xavfsizlik va Audit Tarixi',
  '/settings': 'Tizim va Kafe Sozlamalari',
};

export const Layout: React.FC = () => {
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || 'Vegas Cafe Boshqaruvi';

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar pageTitle={currentTitle} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
