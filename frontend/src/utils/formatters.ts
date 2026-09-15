export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return "0 so'm";
  return amount.toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm";
};

export const formatDate = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRole = (role: string): string => {
  switch (role) {
    case 'ADMINISTRATOR':
      return 'Administrator';
    case 'OFITSIANT':
      return 'Ofitsiant';
    case 'KASSIR':
      return 'Kassir';
    case 'OMBORCHI':
      return 'Omborchi';
    default:
      return role;
  }
};

export const formatOrderStatus = (status: string): { label: string; color: string } => {
  switch (status) {
    case 'NEW':
      return { label: 'Yangi', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'PREPARING':
      return { label: 'Tayyorlanmoqda', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'READY':
      return { label: 'Tayyor', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'SERVED':
      return { label: 'Yetkazildi', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    case 'PAID':
      return { label: 'To\'langan', color: 'bg-emerald-600/10 text-emerald-300 border-emerald-600/30' };
    case 'CANCELLED':
      return { label: 'Bekor qilingan', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    default:
      return { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
};

export const formatTableStatus = (status: string): { label: string; color: string; badge: string } => {
  switch (status) {
    case 'EMPTY':
      return { label: 'Bo\'sh', color: 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' };
    case 'OCCUPIED':
      return { label: 'Band', color: 'border-amber-500/40 bg-amber-500/5 hover:border-amber-400', badge: 'bg-amber-500/20 text-amber-400' };
    case 'RESERVED':
      return { label: 'Rezerv qilingan', color: 'border-indigo-500/40 bg-indigo-500/5 hover:border-indigo-400', badge: 'bg-indigo-500/20 text-indigo-400' };
    default:
      return { label: status, color: 'border-slate-700 bg-slate-800/40', badge: 'bg-slate-700 text-slate-300' };
  }
};
