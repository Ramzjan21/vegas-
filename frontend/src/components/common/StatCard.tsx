import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  trend,
  trendUp = true,
}) => {
  return (
    <div className="bg-[#121B2B] border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all hover:shadow-xl hover:translate-y-[-2px] relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                trendUp
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
