import * as React from 'react';
import { cn } from '@/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  className?: string;
  delay?: number;
}

const colorStyles = {
  blue: {
    bg: 'from-blue-500 to-primary-600',
    iconBg: 'bg-white/20',
  },
  green: {
    bg: 'from-emerald-500 to-success-600',
    iconBg: 'bg-white/20',
  },
  orange: {
    bg: 'from-amber-500 to-warning-600',
    iconBg: 'bg-white/20',
  },
  red: {
    bg: 'from-rose-500 to-danger-600',
    iconBg: 'bg-white/20',
  },
  purple: {
    bg: 'from-violet-500 to-purple-600',
    iconBg: 'bg-white/20',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  className,
  delay = 0,
}) => {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        styles.bg,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend !== undefined && (
            <div className="mt-3 flex items-center gap-1 text-sm">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && <span className="text-white/70">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3', styles.iconBg)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
    </div>
  );
};
