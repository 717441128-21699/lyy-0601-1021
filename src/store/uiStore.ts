import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  currentPage: string;
  activeAssetId: string | null;
  showAssetDetail: boolean;
  showBorrowModal: boolean;
  showReturnModal: boolean;
  showAssetForm: boolean;
  editingAssetId: string | null;
  borrowModalAssetId: string | null;
  returnModalRecordId: string | null;
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
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'assets',
  activeAssetId: null,
  showAssetDetail: false,
  showBorrowModal: false,
  showReturnModal: false,
  showAssetForm: false,
  editingAssetId: null,
  borrowModalAssetId: null,
  returnModalRecordId: null,

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
}));
