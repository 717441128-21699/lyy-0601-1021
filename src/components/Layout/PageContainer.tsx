import * as React from 'react';
import { cn } from '@/utils';
import { useUIStore } from '@/store';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <main
      className={cn(
        'pt-16 min-h-screen transition-all duration-300 bg-dark-50',
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      )}
    >
      <div className={cn('p-6 animate-fade-in', className)}>{children}</div>
    </main>
  );
};

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children, className }) => {
  return (
    <div className={cn('mb-6 flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">{title}</h1>
        {description && <p className="mt-1 text-sm text-dark-500">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
};
