import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  currentPage: string;
  activeAssetId: string | null;
  showAssetDetail: boolean;
  showBorrowModal: boolean;
  showReturnModal: boolean;
  showAssetForm: boolean;
  showReminderModal: boolean;
  showReminderHistoryModal: boolean;
  editingAssetId: string | null;
  borrowModalAssetId: string | null;
  returnModalRecordId: string | null;
  reminderModalRecordId: string | null;
  reminderHistoryRecordId: string | null;
  highlightedBorrowRecordId: string | null;
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  openAssetDetail: (id: string) => void;
  closeAssetDetail: () => void;
  openBorrowModal: (assetId: string) => void;
  closeBorrowModal: () => void;
  openReturnModal: (recordId: string) => void;
  closeReturnModal: () => void;
  openAssetForm: (assetId?: string) => void;
  closeAssetForm: () => void;
  openReminderModal: (recordId: string) => void;
  closeReminderModal: () => void;
  openReminderHistoryModal: (recordId: string) => void;
  closeReminderHistoryModal: () => void;
  navigateToBorrowRecord: (recordId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'assets',
  activeAssetId: null,
  showAssetDetail: false,
  showBorrowModal: false,
  showReturnModal: false,
  showAssetForm: false,
  showReminderModal: false,
  showReminderHistoryModal: false,
  editingAssetId: null,
  borrowModalAssetId: null,
  returnModalRecordId: null,
  reminderModalRecordId: null,
  reminderHistoryRecordId: null,
  highlightedBorrowRecordId: null,

  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  openAssetDetail: (id) => set({ activeAssetId: id, showAssetDetail: true }),
  
  closeAssetDetail: () => set({ showAssetDetail: false, activeAssetId: null }),
  
  openBorrowModal: (assetId) => set({ showBorrowModal: true, borrowModalAssetId: assetId }),
  
  closeBorrowModal: () => set({ showBorrowModal: false, borrowModalAssetId: null }),
  
  openReturnModal: (recordId) => set({ showReturnModal: true, returnModalRecordId: recordId }),
  
  closeReturnModal: () => set({ showReturnModal: false, returnModalRecordId: null }),
  
  openAssetForm: (assetId) => set({ showAssetForm: true, editingAssetId: assetId || null }),
  
  closeAssetForm: () => set({ showAssetForm: false, editingAssetId: null }),
  
  openReminderModal: (recordId) => set({ showReminderModal: true, reminderModalRecordId: recordId }),
  
  closeReminderModal: () => set({ showReminderModal: false, reminderModalRecordId: null }),
  
  openReminderHistoryModal: (recordId) => set({ showReminderHistoryModal: true, reminderHistoryRecordId: recordId }),
  
  closeReminderHistoryModal: () => set({ showReminderHistoryModal: false, reminderHistoryRecordId: null }),
  
  navigateToBorrowRecord: (recordId) => set({ 
    currentPage: 'approval', 
    showAssetDetail: false, 
    activeAssetId: null,
    highlightedBorrowRecordId: recordId 
  }),
}));
