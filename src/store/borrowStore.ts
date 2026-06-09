import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BorrowRecord, BorrowFilters, CreateBorrowRequest, ReturnAssetData, BorrowStatus, CreateReminderRequest, ReminderRecord, CreateMultiBorrowRequest, AssetConflictInfo, BorrowBatch, ReminderFilters, BatchConflictInfo } from '@/types';
import { borrowRecords as mockRecords } from '@/data/mockData';
import { useAssetStore } from './assetStore';
import { useUserStore } from './userStore';

interface OccupancyInfo {
  id: string;
  batchId: string;
  borrowDate: string;
  expectedReturnDate: string;
  status: string;
  userName: string;
  purpose: string;
}

interface ConflictInfo {
  date: string;
  records: BorrowRecord[];
}

interface BorrowState {
  records: BorrowRecord[];
  loading: boolean;
  fetchRecords: (filters?: BorrowFilters) => Promise<BorrowRecord[]>;
  createBorrowRequest: (data: CreateBorrowRequest) => void;
  createMultiBorrowRequest: (data: CreateMultiBorrowRequest) => { success: string[]; failed: AssetConflictInfo[]; batchId: string };
  approveBorrow: (ids: string[], note?: string) => void;
  rejectBorrow: (ids: string[], reason: string) => void;
  returnAsset: (id: string, data: ReturnAssetData) => void;
  getOverdueRecords: (filters?: { department?: string; month?: string }) => BorrowRecord[];
  getPendingCount: () => number;
  getAssetOccupancy: (assetId: string, days?: number) => OccupancyInfo[];
  checkDateConflict: (assetId: string, borrowDate: string, expectedReturnDate: string, excludeRecordId?: string) => ConflictInfo[];
  checkMultiDateConflict: (assetIds: string[], borrowDate: string, expectedReturnDate: string) => AssetConflictInfo[];
  updateOverdueStatus: () => void;
  createReminder: (data: CreateReminderRequest) => ReminderRecord | null;
  getRemindersForRecord: (borrowRecordId: string) => ReminderRecord[];
  getAllReminders: (filters?: ReminderFilters) => ReminderRecord[];
  getBatchById: (batchId: string) => BorrowBatch | null;
  getBatches: (filters?: { month?: string; department?: string }) => BorrowBatch[];
  getBatchRecords: (batchId: string) => BorrowRecord[];
  checkBatchConflicts: (month?: string) => BatchConflictInfo[];
  getMonthlyStatistics: (month: string, department?: string) => {
    borrowTrend: { date: string; count: number }[];
    departmentUsage: { department: string; count: number }[];
    overdueList: BorrowRecord[];
    idleAssets: { asset: any; daysIdle: number }[];
  };
  getRecordById: (id: string) => BorrowRecord | undefined;
}

const generateId = () => `bor-${Date.now().toString().slice(-6)}`;
const generateBatchId = () => `batch-${Date.now().toString().slice(-6)}`;

export const useBorrowStore = create<BorrowState>()(
  persist(
    (set, get) => ({
      records: mockRecords,
      loading: false,

      fetchRecords: async (filters) => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 200));
        
        let result = [...get().records];
        
        if (filters?.keyword) {
          const keyword = filters.keyword.toLowerCase();
          result = result.filter(
            r => r.assetName.toLowerCase().includes(keyword) ||
                 r.userName.toLowerCase().includes(keyword) ||
                 r.purpose.toLowerCase().includes(keyword)
          );
        }
        
        if (filters?.status) {
          result = result.filter(r => r.status === filters.status);
        }
        
        if (filters?.userId) {
          result = result.filter(r => r.userId === filters.userId);
        }
        
        if (filters?.assetId) {
          result = result.filter(r => r.assetId === filters.assetId);
        }
        
        if (filters?.startDate) {
          result = result.filter(r => r.borrowDate >= filters.startDate!);
        }
        
        if (filters?.endDate) {
          result = result.filter(r => r.expectedReturnDate <= filters.endDate!);
        }
        
        set({ loading: false });
        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      createBorrowRequest: (data) => {
        const { currentUser } = useUserStore.getState();
        const asset = useAssetStore.getState().getAssetById(data.assetId);
        
        if (!currentUser || !asset) return;
        
        const approvers = useUserStore.getState().users.filter(u => u.role === 'approver' || u.role === 'admin');
        const approver = approvers[0];
        const batchId = generateBatchId();
        
        const newRecord: BorrowRecord = {
          id: generateId(),
          batchId,
          assetId: data.assetId,
          assetName: asset.name,
          assetNo: asset.assetNo,
          userId: currentUser.id,
          userName: currentUser.name,
          userDepartment: currentUser.departmentName,
          approverId: approver.id,
          approverName: approver.name,
          purpose: data.purpose,
          borrowDate: data.borrowDate,
          expectedReturnDate: data.expectedReturnDate,
          actualReturnDate: null,
          status: 'pending',
          damageLevel: 'none',
          repairCost: 0,
          damageNote: '',
          createdAt: new Date().toISOString().split('T')[0],
          approvedAt: null,
          reminders: [],
        };
        
        set(state => ({ records: [newRecord, ...state.records] }));
      },

      createMultiBorrowRequest: (data) => {
        const { currentUser } = useUserStore.getState();
        const { getAssetById } = useAssetStore.getState();
        const success: string[] = [];
        const failed: AssetConflictInfo[] = [];
        
        if (!currentUser) return { success, failed, batchId: '' };
        
        const approvers = useUserStore.getState().users.filter(u => u.role === 'approver' || u.role === 'admin');
        const approver = approvers[0];
        const batchId = generateBatchId();
        const newRecords: BorrowRecord[] = [];
        
        data.assetIds.forEach(assetId => {
          const conflicts = get().checkDateConflict(assetId, data.borrowDate, data.expectedReturnDate);
          const asset = getAssetById(assetId);
          
          if (conflicts.length > 0 || !asset) {
            if (asset) {
              failed.push({
                assetId,
                assetName: asset.name,
                conflicts,
              });
            }
            return;
          }
          
          const newRecord: BorrowRecord = {
            id: generateId(),
            batchId,
            assetId: asset.id,
            assetName: asset.name,
            assetNo: asset.assetNo,
            userId: currentUser.id,
            userName: currentUser.name,
            userDepartment: currentUser.departmentName,
            approverId: approver.id,
            approverName: approver.name,
            purpose: data.purpose,
            borrowDate: data.borrowDate,
            expectedReturnDate: data.expectedReturnDate,
            actualReturnDate: null,
            status: 'pending',
            damageLevel: 'none',
            repairCost: 0,
            damageNote: '',
            createdAt: new Date().toISOString().split('T')[0],
            approvedAt: null,
            reminders: [],
          };
          
          newRecords.push(newRecord);
          success.push(asset.id);
        });
        
        if (newRecords.length > 0) {
          set(state => ({ records: [...newRecords, ...state.records] }));
        }
        
        return { success, failed, batchId };
      },

      approveBorrow: (ids, note) => {
        const { currentUser } = useUserStore.getState();
        const now = new Date().toISOString();
        
        set(state => ({
          records: state.records.map(r => {
            if (ids.includes(r.id)) {
              useAssetStore.getState().updateAssetStatus(r.assetId, 'borrowed');
              return {
                ...r,
                status: 'approved' as BorrowStatus,
                approverId: currentUser?.id || r.approverId,
                approverName: currentUser?.name || r.approverName,
                approvedAt: now,
              };
            }
            return r;
          }),
        }));
      },

      rejectBorrow: (ids, reason) => {
        const { currentUser } = useUserStore.getState();
        
        set(state => ({
          records: state.records.map(r => {
            if (ids.includes(r.id)) {
              return {
                ...r,
                status: 'rejected' as BorrowStatus,
                approverId: currentUser?.id || r.approverId,
                approverName: currentUser?.name || r.approverName,
                damageNote: reason,
                approvedAt: new Date().toISOString(),
              };
            }
            return r;
          }),
        }));
      },

      returnAsset: (id, data) => {
        const now = new Date().toISOString();
        const record = get().records.find(r => r.id === id);
        
        if (!record) return;
        
        useAssetStore.getState().updateAssetStatus(
          record.assetId,
          data.damageLevel !== 'none' ? 'maintenance' : 'available'
        );
        
        set(state => ({
          records: state.records.map(r => {
            if (r.id === id) {
              return {
                ...r,
                status: data.damageLevel !== 'none' ? 'damaged' as BorrowStatus : 'returned' as BorrowStatus,
                actualReturnDate: now.split('T')[0],
                damageLevel: data.damageLevel,
                repairCost: data.repairCost,
                damageNote: data.damageNote,
              };
            }
            return r;
          }),
        }));
      },

      getOverdueRecords: (filters) => {
        const today = new Date().toISOString().split('T')[0];
        let records = get().records.filter(
          r => (r.status === 'approved' || r.status === 'overdue') && r.expectedReturnDate < today
        );
        
        if (filters?.department) {
          records = records.filter(r => r.userDepartment === filters.department);
        }
        
        if (filters?.month) {
          const [year, month] = filters.month.split('-').map(Number);
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0);
          const monthStartStr = monthStart.toISOString().split('T')[0];
          const monthEndStr = monthEnd.toISOString().split('T')[0];
          
          records = records.filter(r => 
            r.expectedReturnDate >= monthStartStr && r.expectedReturnDate <= monthEndStr
          );
        }
        
        return records;
      },

      getPendingCount: () => {
        return get().records.filter(r => r.status === 'pending').length;
      },

      getAssetOccupancy: (assetId: string, days = 30) => {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        return get().records.filter(
          r => r.assetId === assetId && 
               ['pending', 'approved', 'overdue'].includes(r.status) &&
               r.expectedReturnDate >= today.toISOString().split('T')[0] &&
               r.borrowDate <= futureDateStr
        ).map(r => ({
          id: r.id,
          batchId: r.batchId,
          borrowDate: r.borrowDate,
          expectedReturnDate: r.expectedReturnDate,
          status: r.status,
          userName: r.userName,
          purpose: r.purpose,
        })).sort((a, b) => new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime());
      },

      checkDateConflict: (assetId: string, borrowDate: string, expectedReturnDate: string, excludeRecordId?: string) => {
        const occupancy = get().records.filter(
          r => r.assetId === assetId && 
               ['pending', 'approved', 'overdue'].includes(r.status) &&
               r.id !== excludeRecordId
        );

        const conflicts: { date: string; records: typeof occupancy }[] = [];
        
        const start = new Date(borrowDate);
        const end = new Date(expectedReturnDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const dayConflicts = occupancy.filter(r => {
            return r.borrowDate <= dateStr && r.expectedReturnDate >= dateStr;
          });
          
          if (dayConflicts.length > 0) {
            conflicts.push({
              date: dateStr,
              records: dayConflicts,
            });
          }
        }

        return conflicts;
      },

      checkMultiDateConflict: (assetIds: string[], borrowDate: string, expectedReturnDate: string) => {
        const results: AssetConflictInfo[] = [];
        const { getAssetById } = useAssetStore.getState();
        
        assetIds.forEach(assetId => {
          const conflicts = get().checkDateConflict(assetId, borrowDate, expectedReturnDate);
          const asset = getAssetById(assetId);
          if (conflicts.length > 0 && asset) {
            results.push({
              assetId,
              assetName: asset.name,
              conflicts,
            });
          }
        });
        
        return results;
      },

      updateOverdueStatus: () => {
        const today = new Date().toISOString().split('T')[0];
        set(state => ({
          records: state.records.map(r => {
            if (r.status === 'approved' && r.expectedReturnDate < today) {
              return { ...r, status: 'overdue' as BorrowStatus };
            }
            return r;
          }),
        }));
      },

      createReminder: (data) => {
        const { currentUser } = useUserStore.getState();
        const record = get().records.find(r => r.id === data.borrowRecordId);
        
        if (!currentUser || !record) return null;
        
        const today = new Date();
        const expected = new Date(record.expectedReturnDate);
        const daysOverdue = Math.ceil((today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
        
        const reminder: ReminderRecord = {
          id: `rem-${Date.now().toString().slice(-6)}`,
          borrowRecordId: data.borrowRecordId,
          assetId: record.assetId,
          assetName: record.assetName,
          userId: record.userId,
          userName: record.userName,
          userDepartment: record.userDepartment,
          method: data.method,
          note: data.note,
          status: 'sent',
          remindedBy: currentUser.id,
          remindedByName: currentUser.name,
          remindedAt: new Date().toISOString(),
          expectedReturnDate: record.expectedReturnDate,
          daysOverdue,
        };
        
        set(state => ({
          records: state.records.map(r => {
            if (r.id === data.borrowRecordId) {
              return {
                ...r,
                reminders: [...(r.reminders || []), reminder],
              };
            }
            return r;
          }),
        }));
        
        return reminder;
      },

      getRemindersForRecord: (borrowRecordId: string) => {
        const record = get().records.find(r => r.id === borrowRecordId);
        return record?.reminders || [];
      },

      getAllReminders: (filters) => {
        let reminders = get().records.flatMap(r => r.reminders || []);
        
        if (filters?.method) {
          reminders = reminders.filter(r => r.method === filters.method);
        }
        
        if (filters?.remindedBy) {
          reminders = reminders.filter(r => r.remindedBy === filters.remindedBy);
        }
        
        if (filters?.startDate) {
          reminders = reminders.filter(r => r.remindedAt >= filters.startDate!);
        }
        
        if (filters?.endDate) {
          reminders = reminders.filter(r => r.remindedAt <= filters.endDate!);
        }
        
        return reminders.sort((a, b) => new Date(b.remindedAt).getTime() - new Date(a.remindedAt).getTime());
      },

      getBatchById: (batchId) => {
        const records = get().records.filter(r => r.batchId === batchId);
        if (records.length === 0) return null;
        
        const first = records[0];
        return {
          batchId,
          purpose: first.purpose,
          userId: first.userId,
          userName: first.userName,
          userDepartment: first.userDepartment,
          borrowDate: first.borrowDate,
          expectedReturnDate: first.expectedReturnDate,
          createdAt: first.createdAt,
          records,
        };
      },

      getBatches: (filters) => {
        const batchMap = new Map<string, BorrowRecord[]>();
        
        get().records.forEach(r => {
          if (!batchMap.has(r.batchId)) {
            batchMap.set(r.batchId, []);
          }
          batchMap.get(r.batchId)!.push(r);
        });
        
        let batches: BorrowBatch[] = [];
        batchMap.forEach((records, batchId) => {
          const first = records[0];
          batches.push({
            batchId,
            purpose: first.purpose,
            userId: first.userId,
            userName: first.userName,
            userDepartment: first.userDepartment,
            borrowDate: first.borrowDate,
            expectedReturnDate: first.expectedReturnDate,
            createdAt: first.createdAt,
            records,
          });
        });
        
        if (filters?.month) {
          const [year, month] = filters.month.split('-').map(Number);
          const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
          const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
          batches = batches.filter(b => 
            b.borrowDate >= monthStart && b.borrowDate <= monthEnd
          );
        }
        
        if (filters?.department) {
          batches = batches.filter(b => b.userDepartment === filters.department);
        }
        
        return batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getBatchRecords: (batchId) => {
        return get().records.filter(r => r.batchId === batchId);
      },

      checkBatchConflicts: (month) => {
        const conflicts: BatchConflictInfo[] = [];
        const dateAssetMap = new Map<string, Map<string, BorrowRecord[]>>();
        
        let records = get().records.filter(r => 
          ['pending', 'approved', 'overdue'].includes(r.status)
        );
        
        if (month) {
          const [year, m] = month.split('-').map(Number);
          const monthStart = new Date(year, m - 1, 1);
          const monthEnd = new Date(year, m, 0);
          const monthStartStr = monthStart.toISOString().split('T')[0];
          const monthEndStr = monthEnd.toISOString().split('T')[0];
          records = records.filter(r => 
            r.borrowDate <= monthEndStr && r.expectedReturnDate >= monthStartStr
          );
        }
        
        records.forEach(record => {
          const start = new Date(record.borrowDate);
          const end = new Date(record.expectedReturnDate);
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (!dateAssetMap.has(dateStr)) {
              dateAssetMap.set(dateStr, new Map());
            }
            const assetMap = dateAssetMap.get(dateStr)!;
            if (!assetMap.has(record.assetId)) {
              assetMap.set(record.assetId, []);
            }
            assetMap.get(record.assetId)!.push(record);
          }
        });
        
        dateAssetMap.forEach((assetMap, date) => {
          assetMap.forEach((assetRecords, assetId) => {
            if (assetRecords.length > 1) {
              const batchIds = new Set(assetRecords.map(r => r.batchId));
              if (batchIds.size > 1) {
                assetRecords.forEach(record => {
                  conflicts.push({
                    date,
                    assetId,
                    assetName: record.assetName,
                    batchId: record.batchId,
                    batchPurpose: record.purpose,
                    userName: record.userName,
                  });
                });
              }
            }
          });
        });
        
        return conflicts;
      },

      getMonthlyStatistics: (month, department) => {
        const [year, m] = month.split('-').map(Number);
        const monthStart = new Date(year, m - 1, 1);
        const monthEnd = new Date(year, m, 0);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];
        
        let filteredRecords = get().records.filter(r => 
          r.borrowDate >= monthStartStr && r.borrowDate <= monthEndStr
        );
        
        if (department) {
          filteredRecords = filteredRecords.filter(r => r.userDepartment === department);
        }
        
        const borrowTrend: { date: string; count: number }[] = [];
        const deptMap = new Map<string, number>();
        
        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const count = filteredRecords.filter(r => r.borrowDate === dateStr).length;
          borrowTrend.push({ date: dateStr, count });
        }
        
        filteredRecords.forEach(r => {
          deptMap.set(r.userDepartment, (deptMap.get(r.userDepartment) || 0) + 1);
        });
        
        const departmentUsage = Array.from(deptMap.entries())
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count);
        
        const today = new Date().toISOString().split('T')[0];
        let overdueList = get().records.filter(
          r => (r.status === 'approved' || r.status === 'overdue') && r.expectedReturnDate < today
        ).filter(r => 
          r.expectedReturnDate >= monthStartStr && r.expectedReturnDate <= monthEndStr
        );
        
        if (department) {
          overdueList = overdueList.filter(r => r.userDepartment === department);
        }
        
        const { assets } = useAssetStore.getState();
        const idleAssets = assets.filter(a => a.status === 'available').map(asset => {
          const lastBorrow = get().records
            .filter(r => r.assetId === asset.id && r.status !== 'rejected')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          
          let daysIdle = 30;
          if (lastBorrow) {
            const lastDate = lastBorrow.actualReturnDate || lastBorrow.expectedReturnDate;
            daysIdle = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
          }
          
          return { asset, daysIdle: Math.max(0, daysIdle) };
        }).filter(i => i.daysIdle >= 7).sort((a, b) => b.daysIdle - a.daysIdle);
        
        return { borrowTrend, departmentUsage, overdueList, idleAssets };
      },

      getRecordById: (id) => {
        return get().records.find(r => r.id === id);
      },
    }),
    {
      name: 'asset-management-borrow',
    }
  )
);
