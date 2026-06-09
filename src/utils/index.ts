import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd') {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: zhCN });
}

export function formatDateTime(date: string | Date) {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDaysRemaining(expectedReturn: string): number {
  const today = new Date();
  const returnDate = new Date(expectedReturn);
  return differenceInDays(returnDate, today);
}

export function isOverdue(expectedReturn: string): boolean {
  return getDaysRemaining(expectedReturn) < 0;
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}

interface StatusConfigItem {
  label: string;
  color: string;
  textColor?: string;
  bgColor?: string;
}

interface StatusConfig {
  asset: Record<string, StatusConfigItem>;
  borrow: Record<string, StatusConfigItem>;
  damage: Record<string, StatusConfigItem>;
  role: Record<string, StatusConfigItem>;
  reminder: Record<string, StatusConfigItem>;
}

export const statusConfig: StatusConfig = {
  asset: {
    available: { label: '可用', color: 'bg-success-500', textColor: 'text-success-600', bgColor: 'bg-success-50' },
    borrowed: { label: '借用中', color: 'bg-warning-500', textColor: 'text-warning-600', bgColor: 'bg-warning-50' },
    maintenance: { label: '维修中', color: 'bg-primary-500', textColor: 'text-primary-600', bgColor: 'bg-primary-50' },
    scrapped: { label: '已报废', color: 'bg-dark-500', textColor: 'text-dark-600', bgColor: 'bg-dark-100' },
    lost: { label: '已丢失', color: 'bg-danger-500', textColor: 'text-danger-600', bgColor: 'bg-danger-50' },
  },
  borrow: {
    pending: { label: '待审批', color: 'bg-warning-500', textColor: 'text-warning-600', bgColor: 'bg-warning-50' },
    approved: { label: '已批准', color: 'bg-primary-500', textColor: 'text-primary-600', bgColor: 'bg-primary-50' },
    rejected: { label: '已驳回', color: 'bg-danger-500', textColor: 'text-danger-600', bgColor: 'bg-danger-50' },
    returned: { label: '已归还', color: 'bg-success-500', textColor: 'text-success-600', bgColor: 'bg-success-50' },
    overdue: { label: '已逾期', color: 'bg-danger-500', textColor: 'text-danger-600', bgColor: 'bg-danger-50' },
    damaged: { label: '损坏', color: 'bg-danger-500', textColor: 'text-danger-600', bgColor: 'bg-danger-50' },
  },
  damage: {
    none: { label: '完好', color: 'bg-success-500' },
    minor: { label: '轻微', color: 'bg-warning-500' },
    moderate: { label: '中等', color: 'bg-primary-500' },
    severe: { label: '严重', color: 'bg-danger-500' },
  },
  role: {
    employee: { label: '普通员工', color: 'bg-dark-400' },
    admin: { label: '管理员', color: 'bg-primary-500' },
    approver: { label: '审批人', color: 'bg-success-500' },
  },
  reminder: {
    pending: { label: '待发送', color: 'bg-warning-500' },
    sent: { label: '已发送', color: 'bg-success-500' },
    failed: { label: '发送失败', color: 'bg-danger-500' },
  },
};

export function getStatusLabel(type: keyof StatusConfig, status: string): string {
  const config = statusConfig[type];
  const item = config[status];
  return item?.label || status;
}

export function getStatusColor(type: keyof StatusConfig, status: string): string {
  const config = statusConfig[type];
  const item = config[status];
  return item?.color || 'bg-dark-400';
}

export function getStatusTextColor(type: 'asset' | 'borrow', status: string): string {
  const config = statusConfig[type];
  const item = config[status];
  return item?.textColor || 'text-dark-600';
}

export function getStatusBgColor(type: 'asset' | 'borrow', status: string): string {
  const config = statusConfig[type];
  const item = config[status];
  return item?.bgColor || 'bg-dark-100';
}
