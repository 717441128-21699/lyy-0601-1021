import * as React from 'react';
import { useUIStore, useAssetStore, useBorrowStore } from '@/store';
import { cn, formatDate, formatCurrency, getDaysRemaining, isOverdue } from '@/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import {
  X,
  MapPin,
  User,
  Calendar,
  DollarSign,
  FileText,
  Paperclip,
  HandCoins,
  History,
  AlertCircle,
} from 'lucide-react';

export const AssetDetailPanel: React.FC = () => {
  const { showAssetDetail, activeAssetId, closeAssetDetail, openBorrowModal, openAssetForm } = useUIStore();
  const { getAssetById } = useAssetStore();
  const { fetchRecords } = useBorrowStore();
  const [activeTab, setActiveTab] = React.useState<'info' | 'history'>('info');
  const [borrowHistory, setBorrowHistory] = React.useState<any[]>([]);

  const asset = activeAssetId ? getAssetById(activeAssetId) : null;

  React.useEffect(() => {
    if (activeAssetId) {
      fetchRecords({ assetId: activeAssetId }).then(setBorrowHistory);
    }
  }, [activeAssetId, fetchRecords]);

  if (!showAssetDetail || !asset) return null;

  const canBorrow = asset.status === 'available';

  const columns = [
    {
      key: 'userName',
      header: '借用人',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
            {row.userName.slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-dark-800">{row.userName}</p>
            <p className="text-xs text-dark-500">{row.userDepartment}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'borrowDate',
      header: '借用日期',
      accessor: (row: any) => formatDate(row.borrowDate),
      sortable: true,
    },
    {
      key: 'expectedReturnDate',
      header: '预计归还',
      accessor: (row: any) => {
        const days = getDaysRemaining(row.expectedReturnDate);
        const overdue = isOverdue(row.expectedReturnDate) && row.status === 'approved';
        return (
          <div className="flex items-center gap-1">
            {formatDate(row.expectedReturnDate)}
            {overdue && (
              <span className="text-xs text-danger-500 flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" />
                逾期{Math.abs(days)}天
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: '状态',
      accessor: (row: any) => <StatusBadge type="borrow" status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div
        className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm"
        onClick={closeAssetDetail}
      />
      <div
        className={cn(
          'relative w-full max-w-lg bg-white shadow-2xl overflow-hidden animate-slide-in-right flex flex-col'
        )}
      >
        <div className="relative h-48 bg-gradient-to-br from-primary-700 to-primary-500 overflow-hidden flex-shrink-0">
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-transparent" />
          <button
            onClick={closeAssetDetail}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <StatusBadge type="asset" status={asset.status} />
            <h2 className="mt-2 text-2xl font-bold text-white font-display">{asset.name}</h2>
            <p className="text-white/70 text-sm">{asset.assetNo} · {asset.categoryName}</p>
          </div>
        </div>

        <div className="flex border-b border-dark-100 flex-shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-medium transition-colors relative',
              activeTab === 'info' ? 'text-primary-600' : 'text-dark-500 hover:text-dark-700'
            )}
          >
            资产信息
            {activeTab === 'info' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-medium transition-colors relative',
              activeTab === 'history' ? 'text-primary-600' : 'text-dark-500 hover:text-dark-700'
            )}
          >
            借用历史
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-dark-500 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    存放位置
                  </div>
                  <p className="font-medium text-dark-800">{asset.location}</p>
                </div>
                <div className="bg-dark-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-dark-500 text-sm mb-1">
                    <User className="w-4 h-4" />
                    责任人
                  </div>
                  <p className="font-medium text-dark-800">{asset.managerName}</p>
                </div>
                <div className="bg-dark-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-dark-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    购入日期
                  </div>
                  <p className="font-medium text-dark-800">{formatDate(asset.purchaseDate)}</p>
                </div>
                <div className="bg-dark-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-dark-500 text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    购入价格
                  </div>
                  <p className="font-medium text-dark-800">{formatCurrency(asset.purchasePrice)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-dark-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  资产描述
                </h4>
                <p className="text-dark-600 text-sm leading-relaxed">{asset.description}</p>
              </div>

              {asset.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-dark-700 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    相关附件
                  </h4>
                  <div className="space-y-2">
                    {asset.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-800 truncate">{file}</p>
                          <p className="text-xs text-dark-500">PDF 文档</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-dark-700 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  当前借用
                </h4>
                {borrowHistory.filter(r => r.status === 'approved' || r.status === 'overdue').length > 0 ? (
                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    {borrowHistory
                      .filter(r => r.status === 'approved' || r.status === 'overdue')
                      .slice(0, 1)
                      .map((record) => (
                        <div key={record.id}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-dark-800">{record.userName}</p>
                              <p className="text-sm text-dark-500">{record.userDepartment}</p>
                            </div>
                            <StatusBadge type="borrow" status={record.status} />
                          </div>
                          <div className="mt-2 text-sm text-dark-600">
                            借用时间: {formatDate(record.borrowDate)} ~ {formatDate(record.expectedReturnDate)}
                          </div>
                          <p className="mt-1 text-sm text-dark-600">用途: {record.purpose}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-500">当前无借用记录</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <DataTable
                columns={columns}
                data={borrowHistory}
                rowId={(row) => row.id}
                pageSize={5}
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-dark-100 flex gap-3 flex-shrink-0">
          <Button
            variant="secondary"
            className="flex-1"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => openAssetForm(asset.id)}
          >
            编辑资产
          </Button>
          {canBorrow && (
            <Button
              variant="primary"
              className="flex-1"
              icon={<HandCoins className="w-4 h-4" />}
              onClick={() => {
                closeAssetDetail();
                openBorrowModal(asset.id);
              }}
            >
              申请借用
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
