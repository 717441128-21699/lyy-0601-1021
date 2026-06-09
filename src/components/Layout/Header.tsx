import * as React from 'react';
import { useUIStore, useUserStore } from '@/store';
import { cn, getStatusLabel } from '@/utils';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser, switchRole, logout } = useUserStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const roleMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: { value: UserRole; label: string }[] = [
    { value: 'employee', label: '普通员工' },
    { value: 'approver', label: '审批人' },
    { value: 'admin', label: '管理员' },
  ];

  if (!currentUser) return null;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white border-b border-dark-100 z-30 transition-all duration-300',
        sidebarCollapsed ? 'left-20' : 'left-64'
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-dark-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-dark-600" />
          </button>
          <div className="relative max-w-md w-80 hidden md:block">
            <input
              type="text"
              placeholder="全局搜索资产、申请..."
              className="w-full pl-10 pr-4 py-2 bg-dark-50 border border-transparent rounded-lg text-sm text-dark-700 placeholder:text-dark-400 focus:outline-none focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-100 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={roleMenuRef}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              icon={<User className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">{getStatusLabel('role', currentUser.role)}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-dark-100 shadow-lg py-1 z-50 animate-fade-in">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => {
                      switchRole(role.value);
                      setShowRoleMenu(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2',
                      currentUser.role === role.value
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-dark-700 hover:bg-dark-50'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        currentUser.role === role.value ? 'bg-primary-500' : 'bg-dark-300'
                      )}
                    />
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="relative p-2 rounded-lg hover:bg-dark-100 transition-colors">
            <Bell className="w-5 h-5 text-dark-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-dark-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                {currentUser.avatar}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-dark-800">{currentUser.name}</p>
                <p className="text-xs text-dark-500">{currentUser.departmentName}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-dark-400 hidden sm:block" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-dark-100 shadow-lg py-2 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-dark-100">
                  <p className="text-sm font-medium text-dark-800">{currentUser.name}</p>
                  <p className="text-xs text-dark-500">{currentUser.email}</p>
                </div>
                <div className="py-1">
                  <button className="w-full px-4 py-2 text-left text-sm text-dark-700 hover:bg-dark-50 transition-colors flex items-center gap-2">
                    <User className="w-4 h-4" />
                    个人资料
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-dark-700 hover:bg-dark-50 transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    系统设置
                  </button>
                </div>
                <div className="border-t border-dark-100 pt-1">
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
