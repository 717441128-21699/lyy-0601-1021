import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BorrowRecord, BorrowFilters, CreateBorrowRequest, ReturnAssetData, BorrowStatus, CreateReminderRequest, ReminderRecord, CreateMultiBorrowRequest, AssetConflictInfo } from '@/types';
import { borrowRecords as mockRecords } from '@/data/mockData';
import { useAssetStore } from './assetStore';
import { useUserStore } from './userStore';

interface OccupancyInfo {
  id: string;
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
  createMultiBorrowRequest: (data: CreateMultiBorrowRequest) => { success: string[]; failed: AssetConflictInfo[] };
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
  getAllReminders: () => ReminderRecord[];
}

const generateId = () => `bor-${Date.now().toString().slice(-6)}`;

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
        
        const newRecord: BorrowRecord = {
          id: generateId(),
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
        
        if (!currentUser) return { success, failed };
        
        const approvers = useUserStore.getState().users.filter(u => u.role === 'approver' || u.role === 'admin');
        const approver = approvers[0];
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
        
        return { success, failed };
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

      getAllReminders: () => {
        return get().records.flatMap(r => r.reminders || []);
      },
    }),
    {
      name: 'asset-management-borrow',
    }
  )
);
