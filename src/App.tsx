import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import {
  AssetDetailPanel,
  BorrowModal,
  ReturnModal,
  AssetFormModal,
} from '@/components/modals';
import AssetLedgerPage from '@/pages/AssetLedger';
import BorrowRequestPage from '@/pages/BorrowRequest';
import ApprovalReturnPage from '@/pages/ApprovalReturn';
import CalendarBoardPage from '@/pages/CalendarBoard';
import StatisticsPage from '@/pages/Statistics';
import { useUIStore, useUserStore } from '@/store';
import { cn } from '@/utils';

export default function App() {
  const { showAssetDetail, activeAssetId } = useUIStore();
  const { currentUser, login } = useUserStore();

  React.useEffect(() => {
    if (!currentUser) {
      login();
    }
  }, [currentUser, login]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-dark-50">
        <Sidebar />
        <Header />
        
        <Routes>
          <Route path="/" element={<Navigate to="/assets" replace />} />
          <Route path="/assets" element={<AssetLedgerPage />} />
          <Route path="/apply" element={<BorrowRequestPage />} />
          <Route path="/approval" element={<ApprovalReturnPage />} />
          <Route path="/calendar" element={<CalendarBoardPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="*" element={<Navigate to="/assets" replace />} />
        </Routes>

        <div
          className={cn(
            'fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out',
            showAssetDetail ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {showAssetDetail && activeAssetId && <AssetDetailPanel />}
        </div>

        {showAssetDetail && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => useUIStore.getState().closeAssetDetail()}
          />
        )}

        <BorrowModal />
        <ReturnModal />
        <AssetFormModal />
      </div>
    </Router>
  );
}
