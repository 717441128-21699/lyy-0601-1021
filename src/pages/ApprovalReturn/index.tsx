import * as React from 'react';
import { useBorrowStore, useUIStore, useUserStore, useAssetStore } from '@/store';
import { PageContainer, PageHeader } from '@/components/Layout/PageContainer';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { cn, formatDate } from '@/utils';
import { BorrowRecord, BorrowStatus } from '@/types';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  Calendar,
  User,
  PackageCheck,
  AlertTriangle,
  ScanLine,
  AlertCircle,
  Bell,
  History,
  ArrowLeft,
  Package,
  X,
  List,
  Layers,
  ChevronRight,
} from 'lucide-react';

type TabMode = 'pending' | 'borrowed' | 'returned';
type ViewMode = 'record' | 'batch';

const statusOptions: { value: BorrowStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'returned', label: '已归还' },
  { value: 'overdue', label: '已逾期' },
  { value: 'damaged', label: '已损坏' },
];

const ApprovalReturnPage: React.FC = () => {
  const { records, fetchRecords, approveBorrow, rejectBorrow, loading, updateOverdueStatus, getRemindersForRecord, getRecordById, getBatches, getBatchRecords, getBatchById } = useBorrowStore();
  const { openReturnModal, openReminderModal, openReminderHistoryModal, highlightedBorrowRecordId, previousAssetDetailId, navigateBackToAssetDetail, clearHighlightedRecord } = useUIStore();
  const { currentUser } = useUserStore();
  const { getAssetById } = useAssetStore();
  const [activeTab, setActiveTab] = React.useState<TabMode>('pending');
  const [viewMode, setViewMode] = React.useState<ViewMode>('record');
  const [keyword, setKeyword] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<BorrowStatus | 'all'>('all');
  const [filteredRecords, setFilteredRecords] = React.useState<BorrowRecord[]>([]);
  const [filteredBatches, setFilteredBatches] = React.useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = React.useState<string | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [highlightMessage, setHighlightMessage] = React.useState<string | null>(null);

  const isApprover = currentUser?.role === 'approver' || currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee';

  React.useEffect(() => {
    updateOverdueStatus();
  }, [updateOverdueStatus]);

  React.useEffect(() => {
    if (highlightedBorrowRecordId) {
      const record = getRecordById(highlightedBorrowRecordId);
      if (record) {
        let targetTab: TabMode = 'pending';
        if (['approved', 'overdue'].includes(record.status)) {
          targetTab = 'borrowed';
        } else if (['returned', 'damaged', 'rejected'].includes(record.status)) {
          targetTab = 'returned';
        }
        setActiveTab(targetTab);
        
        const asset = getAssetById(record.assetId);
        setHighlightMessage(
          `已定位到借用记录：${record.userName} - ${asset?.name || record.assetName}`
        );
        
        setTimeout(() => {
          setHighlightMessage(null);
        }, 5000);
      }
    }
  }, [highlightedBorrowRecordId, getRecordById, getAssetById]);

  React.useEffect(() => {
    const filters: any = {};
    if (keyword) filters.keyword = keyword;
    if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
    
    if (isEmployee && currentUser) {
      filters.userId = currentUser.id;
    }
    
    if (activeTab === 'pending') {
      filters.status = 'pending';
    } else if (activeTab === 'borrowed') {
    } else if (activeTab === 'returned') {
    }
    
    fetchRecords(filters).then(data => {
      if (activeTab === 'borrowed') {
        data = data.filter(r => ['approved', 'overdue'].includes(r.status));
      } else if (activeTab === 'returned') {
        data = data.filter(r => ['returned', 'damaged', 'rejected'].includes(r.status));
      } else if (activeTab === 'pending') {
        data = data.filter(r => r.status === 'pending');
      }
      setFilteredRecords(data);
    });
  }, [keyword, statusFilter, activeTab, fetchRecords, isEmployee, currentUser]);

  React.useEffect(() => {
    if (viewMode === 'batch') {
      const batchFilters: any = {};
      if (isEmployee && currentUser) {
        batchFilters.department = currentUser.departmentName;
      }
      
      const batches = getBatches(batchFilters);
      
      let filtered = batches;
      
      if (activeTab === 'pending') {
        filtered = batches.filter(b => 
          b.records.some(r => r.status === 'pending')
        );
      } else if (activeTab === 'borrowed') {
        filtered = batches.filter(b => 
          b.records.some(r => ['approved', 'overdue'].includes(r.status))
        );
      } else if (activeTab === 'returned') {
        filtered = batches.filter(b => 
          b.records.some(r => ['returned', 'damaged', 'rejected'].includes(r.status))
        );
      }
      
      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter(b => 
          b.purpose.toLowerCase().includes(kw) ||
          b.userName.toLowerCase().includes(kw) ||
          b.records.some(r => r.assetName.toLowerCase().includes(kw))
        );
      }
      
      setFilteredBatches(filtered);
    }
  }, [viewMode, activeTab, keyword, getBatches, isEmployee, currentUser]);

  const getCountByStatus = (status: BorrowStatus | BorrowStatus[], forCurrentUser = false) => {
    return records.filter(r => {
      const statusMatch = Array.isArray(status) ? status.includes(r.status) : r.status === status;
      const userMatch = forCurrentUser && currentUser ? r.userId === currentUser.id : true;
      return statusMatch && userMatch;
    }).length;
  };

  const pendingCount = getCountByStatus('pending', isEmployee);
  const borrowedCount = getCountByStatus(['approved', 'overdue'], isEmployee);
  const returnedCount = getCountByStatus(['returned', 'damaged'], isEmployee);
  const overdueCount = getCountByStatus('overdue', isEmployee);

  const handleSelectRow = (id: string, selected: boolean) => {
    if (!isApprover) return;
    setSelectedRows(prev => 
      selected ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (!isApprover) return;
    setSelectedRows(selected ? filteredRecords.map(r => r.id) : []);
  };

  const handleApprove = async () => {
    if (selectedRows.length === 0 || !isApprover) return;
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    approveBorrow(selectedRows);
    setSelectedRows([]);
    setSubmitting(false);
  };

  const handleReject = () => {
    if (selectedRows.length === 0 || !isApprover) return;
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim() || !isApprover) return;
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    rejectBorrow(selectedRows, rejectReason.trim());
    setSelectedRows([]);
    setRejectReason('');
    setShowRejectModal(false);
    setSubmitting(false);
  };

  const baseColumns = [
    {
      key: 'assetName',
      header: '资产信息',
      accessor: (record: BorrowRecord) => (
        <div>
          <p className="font-medium text-dark-800">{record.assetName}</p>
          <p className="text-xs text-dark-500">{record.assetNo}</p>
        </div>
      ),
    },
    {
      key: 'userName',
      header: '申请人',
      accessor: (record: BorrowRecord) => (
        <div className="text-sm">
          <p className="text-dark-700">{record.userName}</p>
          <p className="text-xs text-dark-500">{record.userDepartment}</p>
        </div>
      ),
    },
    {
      key: 'borrowDate',
      header: '借用周期',
      accessor: (record: BorrowRecord) => (
        <div className="text-sm text-dark-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(record.borrowDate)}
          </div>
          <div className="text-xs text-dark-400 mt-1">
            至 {formatDate(record.expectedReturnDate)}
          </div>
          {record.status === 'overdue' && (
            <div className="text-xs text-danger-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              已逾期
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'purpose',
      header: '用途',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-600 truncate max-w-xs" title={record.purpose}>
          {record.purpose}
        </p>
      ),
    },
    {
      key: 'status',
      header: '状态',
      accessor: (record: BorrowRecord) => (
        <StatusBadge type="borrow" status={record.status} size="sm" />
      ),
    },
    {
      key: 'createdAt',
      header: '申请时间',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-500">{formatDate(record.createdAt)}</p>
      ),
    },
  ];

  const pendingColumns = [
    ...baseColumns,
    ...(isApprover ? [{
      key: 'actions',
      header: '操作',
      accessor: (record: BorrowRecord) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="success"
            icon={<CheckCircle className="w-4 h-4" />}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              approveBorrow([record.id]);
            }}
          >
            同意
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<XCircle className="w-4 h-4" />}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedRows([record.id]);
              setShowRejectModal(true);
            }}
          >
            驳回
          </Button>
        </div>
      ),
    }] : []),
  ];

  const borrowedColumns = [
    ...baseColumns,
    {
      key: 'approverName',
      header: '审批人',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-600">{record.approverName}</p>
      ),
    },
    {
      key: 'reminders',
      header: '催还',
      accessor: (record: BorrowRecord) => {
        if (record.status !== 'overdue') return null;
        const reminders = getRemindersForRecord(record.id);
        return (
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            reminders.length > 0 ? 'bg-warning-100 text-warning-700' : 'bg-dark-100 text-dark-600'
          )}>
            {reminders.length} 次
          </span>
        );
      },
    },
    ...(isApprover || isEmployee ? [{
      key: 'actions',
      header: '操作',
      accessor: (record: BorrowRecord) => {
        const canReturn = isApprover || (isEmployee && currentUser && record.userId === currentUser.id);
        const isOverdue = record.status === 'overdue';
        
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {canReturn && (
              <Button
                size="sm"
                variant={isOverdue ? 'danger' : 'primary'}
                icon={<ScanLine className="w-3.5 h-3.5" />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  openReturnModal(record.id);
                }}
              >
                {isOverdue ? '逾期归还' : '归还'}
              </Button>
            )}
            {isOverdue && isApprover && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Bell className="w-3.5 h-3.5 text-warning-600" />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    openReminderModal(record.id);
                  }}
                >
                  催还
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<History className="w-3.5 h-3.5" />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    openReminderHistoryModal(record.id);
                  }}
                >
                  历史
                </Button>
              </>
            )}
          </div>
        );
      },
    }] : []),
  ];

  const returnedColumns = [
    ...baseColumns,
    {
      key: 'actualReturnDate',
      header: '归还时间',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-500">
          {record.actualReturnDate ? formatDate(record.actualReturnDate) : '-'}
        </p>
      ),
    },
    {
      key: 'damageLevel',
      header: '损坏情况',
      accessor: (record: BorrowRecord) => {
        if (record.status === 'rejected') {
          return (
            <div className="text-sm">
              <p className="text-danger-600">已驳回</p>
              {record.damageNote && (
                <p className="text-xs text-dark-500 mt-1" title={record.damageNote}>
                  原因: {record.damageNote}
                </p>
              )}
            </div>
          );
        }
        if (record.damageLevel === 'none') {
          return <span className="text-sm text-success-600">完好无损</span>;
        }
        const damageLabels: Record<string, string> = {
          minor: '轻微损坏',
          moderate: '中等损坏',
          severe: '严重损坏',
        };
        return (
          <div className="text-sm">
            <p className={cn(
              record.damageLevel === 'severe' ? 'text-danger-600' : 
              record.damageLevel === 'moderate' ? 'text-primary-600' : 'text-warning-600'
            )}>
              {damageLabels[record.damageLevel] || '-'}
            </p>
            {record.repairCost > 0 && (
              <p className="text-xs text-dark-500">维修费: ¥{record.repairCost}</p>
            )}
          </div>
        );
      },
    },
  ];

  const getColumns = () => {
    if (activeTab === 'pending') return pendingColumns;
    if (activeTab === 'borrowed') return borrowedColumns;
    return returnedColumns;
  };

  const previousAsset = previousAssetDetailId ? getAssetById(previousAssetDetailId) : null;

  const handleHighlightedVisible = () => {
    setTimeout(() => {
      clearHighlightedRecord();
    }, 3000);
  };

  return (
    <PageContainer>
      {highlightMessage && (
        <div className="mb-4 bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-warning-800">{highlightMessage}</p>
              <p className="text-sm text-warning-600 mt-0.5">记录已高亮显示，3秒后自动取消</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<X className="w-4 h-4" />}
            onClick={() => {
              setHighlightMessage(null);
              clearHighlightedRecord();
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        {previousAsset && (
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={navigateBackToAssetDetail}
            className="flex-shrink-0"
          >
            返回资产详情
          </Button>
        )}
        {previousAsset && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <Package className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-primary-700">
              来自：<span className="font-medium">{previousAsset.name}</span>
            </span>
          </div>
        )}
      </div>

      <PageHeader
        title="审批归还"
        description={
          isEmployee 
            ? "查看我的借用记录和归还资产"
            : "处理借用申请、审批管理、资产归还登记"
        }
      />

      {isEmployee && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary-800">员工视图</p>
              <p className="text-sm text-primary-600 mt-1">
                当前您以普通员工身份登录，仅可查看和管理自己的借用记录。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">待审批</p>
              <p className="text-2xl font-bold mt-1">{pendingCount}</p>
            </div>
            <Clock className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">借用中</p>
              <p className="text-2xl font-bold mt-1">{borrowedCount - overdueCount}</p>
            </div>
            <User className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">已归还</p>
              <p className="text-2xl font-bold mt-1">{returnedCount}</p>
            </div>
            <PackageCheck className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-danger-500 to-danger-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">已逾期</p>
              <p className="text-2xl font-bold mt-1">{overdueCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-white/30" />
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-xl shadow-card p-1 mb-6 w-fit">
        <button
          onClick={() => { setActiveTab('pending'); setSelectedRows([]); }}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2',
            activeTab === 'pending'
              ? 'bg-warning-500 text-white shadow-md'
              : 'text-dark-600 hover:bg-dark-50'
          )}
        >
          <Clock className="w-4 h-4" />
          待审批
          {pendingCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('borrowed'); setSelectedRows([]); }}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2',
            activeTab === 'borrowed'
              ? 'bg-primary-500 text-white shadow-md'
              : 'text-dark-600 hover:bg-dark-50'
          )}
        >
          <User className="w-4 h-4" />
          借用中
          {borrowedCount > 0 && (
            <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full text-xs">
              {borrowedCount}
            </span>
          )}
          {overdueCount > 0 && (
            <span className="bg-danger-500 text-white px-2 py-0.5 rounded-full text-xs">
              逾期{overdueCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('returned'); setSelectedRows([]); }}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2',
            activeTab === 'returned'
              ? 'bg-success-500 text-white shadow-md'
              : 'text-dark-600 hover:bg-dark-50'
          )}
        >
          <RotateCcw className="w-4 h-4" />
          已归还
          <span className="bg-dark-100 text-dark-600 px-2 py-0.5 rounded-full text-xs">
            {returnedCount}
          </span>
        </button>
      </div>

      {isApprover && (
        <div className="flex gap-1 bg-white rounded-xl shadow-card p-1 mb-6 w-fit">
          <button
            onClick={() => { setViewMode('record'); setSelectedBatchId(null); }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              viewMode === 'record'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-dark-600 hover:bg-dark-50'
            )}
          >
            <List className="w-4 h-4" />
            按记录查看
          </button>
          <button
            onClick={() => { setViewMode('batch'); setSelectedRows([]); }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              viewMode === 'batch'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-dark-600 hover:bg-dark-50'
            )}
          >
            <Layers className="w-4 h-4" />
            按批次查看
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[280px]">
            <SearchInput
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={setKeyword}
              placeholder={
                viewMode === 'batch' 
                  ? "搜索会议用途、申请人、资产名称..."
                  : (isEmployee ? "搜索我的资产名称、用途..." : "搜索资产名称、申请人、用途...")
              }
            />
          </div>
          {viewMode === 'record' && (
            <div className="w-40">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BorrowStatus | 'all')}
              />
            </div>
          )}
          {isApprover && activeTab === 'pending' && viewMode === 'record' && selectedRows.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-dark-500">
                已选择 {selectedRows.length} 项
              </span>
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleApprove}
                loading={submitting}
              >
                批量同意
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={handleReject}
                loading={submitting}
              >
                批量驳回
              </Button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'borrowed' && overdueCount > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-danger-800">逾期提醒</p>
              <p className="text-sm text-danger-600 mt-1">
                当前有 {overdueCount} 项借用已逾期未归还，请尽快处理。
              </p>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'record' ? (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <DataTable
            columns={getColumns()}
            data={filteredRecords}
            loading={loading}
            pagination={true}
            pageSize={10}
            selectable={activeTab === 'pending' && isApprover}
            selectedRows={selectedRows}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            rowId={(row) => row.id}
            highlightedRowId={highlightedBorrowRecordId}
            onHighlightedRowVisible={handleHighlightedVisible}
            emptyText={
              activeTab === 'pending' ? '暂无待审批申请' :
              activeTab === 'borrowed' ? '暂无借用中资产' : '暂无归还记录'
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {selectedBatchId ? (
            <BatchDetailView
              batchId={selectedBatchId}
              onBack={() => setSelectedBatchId(null)}
              activeTab={activeTab}
              isApprover={isApprover}
              handleApprove={handleApprove}
              handleRejectSingle={(id) => {
                setSelectedRows([id]);
                setShowRejectModal(true);
              }}
              openReturnModal={openReturnModal}
              openReminderModal={openReminderModal}
              openReminderHistoryModal={openReminderHistoryModal}
              getRemindersForRecord={getRemindersForRecord}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                  <p className="text-dark-500">
                    {activeTab === 'pending' ? '暂无待审批批次' :
                     activeTab === 'borrowed' ? '暂无借用中批次' : '暂无已归还批次'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-dark-100">
                  {filteredBatches.map((batch) => (
                    <div
                      key={batch.batchId}
                      className="p-4 hover:bg-dark-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedBatchId(batch.batchId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-dark-800">{batch.purpose}</h4>
                            <span className="text-xs bg-dark-100 text-dark-600 px-2 py-0.5 rounded-full">
                              {batch.records.length} 件资产
                            </span>
                            <BatchStatusBadge records={batch.records} />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-dark-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {batch.userName} · {batch.userDepartment}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(batch.borrowDate)} ~ {formatDate(batch.expectedReturnDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              申请时间: {formatDate(batch.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {batch.records.slice(0, 5).map((record: BorrowRecord, i: number) => (
                              <div key={i} className="flex items-center gap-1">
                                <StatusBadge type="borrow" status={record.status} size="sm" />
                                <span className="text-xs text-dark-600">{record.assetName}</span>
                              </div>
                            ))}
                            {batch.records.length > 5 && (
                              <span className="text-xs text-dark-500">
                                +{batch.records.length - 5} 件
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-dark-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}
        title="驳回申请"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); confirmReject(); }} className="space-y-4">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning-800">确认驳回选中的 {selectedRows.length} 项申请？</p>
                <p className="text-sm text-warning-600 mt-1">请填写驳回原因，申请人将会收到通知</p>
              </div>
            </div>
          </div>
          <Textarea
            label="驳回原因"
            placeholder="请详细说明驳回原因..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            required
          />
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={submitting}
              icon={<XCircle className="w-4 h-4" />}
              disabled={!rejectReason.trim()}
            >
              确认驳回
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </PageContainer>
  );
};

const BatchStatusBadge: React.FC<{ records: BorrowRecord[] }> = ({ records }) => {
  const statuses = new Set(records.map(r => r.status));
  
  if (statuses.has('pending') && records.some(r => r.status === 'pending')) {
    return (
      <span className="text-xs bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full">
        部分待审批
      </span>
    );
  }
  
  if (statuses.has('overdue')) {
    return (
      <span className="text-xs bg-danger-100 text-danger-700 px-2 py-0.5 rounded-full">
        含逾期
      </span>
    );
  }
  
  if (statuses.has('rejected') && statuses.has('approved')) {
    return (
      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
        部分通过
      </span>
    );
  }
  
  if ([...statuses].every(s => s === 'approved')) {
    return (
      <span className="text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
        全部通过
      </span>
    );
  }
  
  if ([...statuses].every(s => s === 'returned' || s === 'damaged')) {
    return (
      <span className="text-xs bg-dark-100 text-dark-700 px-2 py-0.5 rounded-full">
        已归还
      </span>
    );
  }
  
  return null;
};

interface BatchDetailViewProps {
  batchId: string;
  onBack: () => void;
  activeTab: TabMode;
  isApprover: boolean;
  handleApprove: (ids: string[]) => void;
  handleRejectSingle: (id: string) => void;
  openReturnModal: (id: string) => void;
  openReminderModal: (id: string) => void;
  openReminderHistoryModal: (id: string) => void;
  getRemindersForRecord: (id: string) => any[];
}

const BatchDetailView: React.FC<BatchDetailViewProps> = ({
  batchId,
  onBack,
  activeTab,
  isApprover,
  handleApprove,
  handleRejectSingle,
  openReturnModal,
  openReminderModal,
  openReminderHistoryModal,
  getRemindersForRecord,
}) => {
  const { getBatchById } = useBorrowStore();
  const { getAssetById } = useAssetStore();
  const batch = getBatchById(batchId);

  if (!batch) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
      <p className="text-dark-500">批次不存在</p>
      <Button variant="secondary" onClick={onBack} className="mt-4">
        返回列表
      </Button>
      </div>
    );
  }

  const pendingRecords = batch.records.filter(r => r.status === 'pending');
  const approvedRecords = batch.records.filter(r => ['approved', 'overdue'].includes(r.status));
  const returnedRecords = batch.records.filter(r => ['returned', 'damaged', 'rejected'].includes(r.status));

  const displayRecords = activeTab === 'pending' ? pendingRecords :
                       activeTab === 'borrowed' ? approvedRecords :
                       returnedRecords;

  const handleBatchApproveAll = () => {
    if (pendingRecords.length > 0) {
      handleApprove(pendingRecords.map(r => r.id));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="p-4 border-b border-dark-100 bg-dark-50">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBack}
          >
            返回批次列表
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold text-dark-800 text-lg">{batch.purpose}</h3>
            <div className="flex items-center gap-4 text-sm text-dark-500 mt-1">
              <span>{batch.userName} · {batch.userDepartment}</span>
              <span>{formatDate(batch.borrowDate)} ~ {formatDate(batch.expectedReturnDate)}</span>
              <span className="text-xs bg-dark-100 text-dark-600 px-2 py-0.5 rounded-full">
                {batch.records.length} 件资产
              </span>
            </div>
          </div>
          {isApprover && activeTab === 'pending' && pendingRecords.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-dark-500">
                待审批 {pendingRecords.length} 项
              </span>
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleBatchApproveAll}
              >
                全部同意
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-center">
            <p className="text-warning-600">待审批</p>
            <p className="text-xl font-bold text-warning-700">{pendingRecords.length}</p>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-center">
            <p className="text-primary-600">借用中</p>
            <p className="text-xl font-bold text-primary-700">{approvedRecords.length}</p>
          </div>
          <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-center">
            <p className="text-success-600">已归还</p>
            <p className="text-xl font-bold text-success-700">{returnedRecords.length}</p>
          </div>
        </div>

        <div className="space-y-3">
          {displayRecords.map((record) => {
            const reminders = getRemindersForRecord(record.id);
            const isOverdue = record.status === 'overdue';
            
            return (
              <div
                key={record.id}
                className="border border-dark-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <img
                      src={getAssetById(record.assetId)?.imageUrl || ''}
                      alt={record.assetName}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-dark-800">{record.assetName}</h4>
                        <span className="text-xs text-dark-500">{record.assetNo}</span>
                        <StatusBadge type="borrow" status={record.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-dark-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(record.borrowDate)} ~ {formatDate(record.expectedReturnDate)}
                        </span>
                        {isOverdue && (
                          <span className="text-danger-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            已逾期
                          </span>
                        )}
                        {record.damageLevel && record.damageLevel !== 'none' && (
                          <span className="text-warning-600">
                            {record.damageLevel === 'minor' ? '轻微损坏' :
                             record.damageLevel === 'moderate' ? '中等损坏' : '严重损坏'}
                          </span>
                        )}
                        {record.repairCost && record.repairCost > 0 && (
                          <span className="text-dark-600">
                            维修费: ¥{record.repairCost}
                          </span>
                        )}
                      </div>
                      {record.damageNote && (
                        <p className="text-xs text-dark-500 mt-1">
                          备注: {record.damageNote}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {isApprover && record.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          icon={<CheckCircle className="w-4 h-4" />}
                          onClick={() => handleApprove([record.id])}
                        >
                          同意
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<XCircle className="w-4 h-4" />}
                          onClick={() => handleRejectSingle(record.id)}
                        >
                          驳回
                        </Button>
                      </>
                    )}
                    
                    {(record.status === 'approved' || record.status === 'overdue') && (
                      <>
                        <Button
                          size="sm"
                          variant={isOverdue ? 'danger' : 'primary'}
                          icon={<ScanLine className="w-3.5 h-3.5" />}
                          onClick={() => openReturnModal(record.id)}
                        >
                          {isOverdue ? '逾期归还' : '归还'}
                        </Button>
                        {isOverdue && isApprover && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Bell className="w-3.5 h-3.5 text-warning-600" />}
                              onClick={() => openReminderModal(record.id)}
                            >
                              催还
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<History className="w-3.5 h-3.5" />}
                              onClick={() => openReminderHistoryModal(record.id)}
                            >
                              历史
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    {isOverdue && isApprover && reminders.length > 0 && (
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        'bg-warning-100 text-warning-700'
                      )}>
                        {reminders.length} 次催还
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {displayRecords.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500">
                {activeTab === 'pending' ? '本批次暂无待审批资产' :
                 activeTab === 'borrowed' ? '本批次暂无借用中资产' : '本批次暂无已归还资产'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalReturnPage;
