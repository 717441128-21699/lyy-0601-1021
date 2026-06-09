import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils';
import { useUIStore, useUserStore, useBorrowStore } from '@/store';
import {
  LayoutDashboard,
  ClipboardList,
  FileCheck,
  Calendar,
  BarChart3,
  ChevronLeft,
  Package2,
  Bell,
} from 'lucide-react';

const navItems = [
  { path: '/assets', label: '资产台账', icon: Package2 },
  { path: '/apply', label: '借用申请', icon: ClipboardList },
  { path: '/approval', label: '审批归还', icon: FileCheck },
  { path: '/calendar', label: '日历看板', icon: Calendar },
  { path: '/statistics', label: '统计中心', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser } = useUserStore();
  const pendingCount = useBorrowStore((state) => state.getPendingCount());

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-primary-700 text-white transition-all duration-300 z-40 shadow-sidebar',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold font-display whitespace-nowrap">资产管家</h1>
                <p className="text-xs text-white/60 whitespace-nowrap">企业资产管理平台</p>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className={cn(
              'p-1.5 rounded-lg hover:bg-white/10 transition-colors',
              sidebarCollapsed && 'absolute -right-3 top-6 bg-primary-700 border border-white/10'
            )}
          >
            <ChevronLeft
              className={cn('w-4 h-4 transition-transform', sidebarCollapsed && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const showBadge = item.path === '/approval' && pendingCount > 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
                {showBadge && (
                  <span
                    className={cn(
                      'absolute bg-danger-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1',
                      sidebarCollapsed ? 'top-1 right-1' : 'right-3'
                    )}
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
                {isActive && !sidebarCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {currentUser && !sidebarCollapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                {currentUser.avatar}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-white/60 truncate">{currentUser.departmentName}</p>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors relative">
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-danger-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
