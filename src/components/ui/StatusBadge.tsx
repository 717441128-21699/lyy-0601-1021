import * as React from 'react';
import { cn, getStatusLabel, getStatusColor, getStatusTextColor, getStatusBgColor } from '@/utils';

interface StatusBadgeProps {
  type: 'asset' | 'borrow' | 'damage' | 'role';
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, size = 'md', className }) => {
  const label = getStatusLabel(type, status);
  const dotColor = getStatusColor(type, status);
  const textColor = type === 'asset' || type === 'borrow' ? getStatusTextColor(type, status) : 'text-dark-700';
  const bgColor = type === 'asset' || type === 'borrow' ? getStatusBgColor(type, status) : 'bg-dark-100';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        bgColor,
        textColor,
        sizeStyles[size],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
      {label}
    </span>
  );
};
