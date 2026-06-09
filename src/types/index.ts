export type AssetStatus = 'available' | 'borrowed' | 'maintenance' | 'scrapped' | 'lost';

export type BorrowStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue' | 'damaged';

export type UserRole = 'employee' | 'admin' | 'approver';

export type DamageLevel = 'none' | 'minor' | 'moderate' | 'severe';

export type CalendarView = 'month' | 'week' | 'list';

export type ReminderMethod = 'email' | 'sms' | 'phone' | 'wechat' | 'other';

export type ReminderStatus = 'pending' | 'sent' | 'failed';

export interface Asset {
  id: string;
  name: string;
  assetNo: string;
  categoryId: string;
  categoryName: string;
  status: AssetStatus;
  location: string;
  managerId: string;
  managerName: string;
  description: string;
  imageUrl: string;
  purchaseDate: string;
  purchasePrice: number;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReminderRecord {
  id: string;
  borrowRecordId: string;
  assetId: string;
  assetName: string;
  userId: string;
  userName: string;
  userDepartment: string;
  method: ReminderMethod;
  note: string;
  status: ReminderStatus;
  remindedBy: string;
  remindedByName: string;
  remindedAt: string;
  expectedReturnDate: string;
  daysOverdue: number;
}

export interface BorrowRecord {
  id: string;
  assetId: string;
  assetName: string;
  assetNo: string;
  userId: string;
  userName: string;
  userDepartment: string;
  approverId: string;
  approverName: string;
  purpose: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  status: BorrowStatus;
  damageLevel: DamageLevel;
  repairCost: number;
  damageNote: string;
  createdAt: string;
  approvedAt: string | null;
  reminders: ReminderRecord[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  role: UserRole;
  avatar: string;
}

export interface Department {
  id: string;
  name: string;
  managerId: string;
  employeeCount: number;
}

export interface AssetCategory {
  id: string;
  name: string;
  icon: string;
}

export interface CreateBorrowRequest {
  assetId: string;
  borrowDate: string;
  expectedReturnDate: string;
  purpose: string;
}

export interface CreateMultiBorrowRequest {
  assetIds: string[];
  borrowDate: string;
  expectedReturnDate: string;
  purpose: string;
}

export interface ReturnAssetData {
  damageLevel: DamageLevel;
  repairCost: number;
  damageNote: string;
}

export interface CreateReminderRequest {
  borrowRecordId: string;
  method: ReminderMethod;
  note: string;
}

export interface AssetConflictInfo {
  assetId: string;
  assetName: string;
  conflicts: { date: string; records: BorrowRecord[] }[];
}

export interface AssetFilters {
  keyword?: string;
  categoryId?: string;
  status?: AssetStatus;
  location?: string;
}

export interface BorrowFilters {
  keyword?: string;
  status?: BorrowStatus;
  userId?: string;
  assetId?: string;
  startDate?: string;
  endDate?: string;
}

export interface StatisticsData {
  totalAssets: number;
  availableAssets: number;
  borrowedAssets: number;
  overdueAssets: number;
  monthlyBorrowCount: number;
  borrowTrend: { date: string; count: number }[];
  departmentUsage: { department: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  overdueList: BorrowRecord[];
  idleAssets: Asset[];
  damagedRecords: BorrowRecord[];
}
