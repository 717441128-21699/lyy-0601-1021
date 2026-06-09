import * as React from 'react';
import { useBorrowStore, useUIStore, useUserStore } from '@/store';
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
  Filter,
  ChevronDown,
} from 'lucide-react';

type TabMode = 'pending' | 'borrowed' | 'returned';

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
  const { records, fetchRecords, approveBorrow, rejectBorrow, loading } = useBorrowStore();
  const { openReturnModal } = useUIStore();
  const { currentUser } = useUserStore();
  const [activeTab, setActiveTab] = React.useState<TabMode>('pending');
  const [keyword, setKeyword] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<BorrowStatus | 'all'>('all');
  const [filteredRecords, setFilteredRecords] = React.useState<BorrowRecord[]>([]);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const isApprover = currentUser?.role === 'approver' || currentUser?.role === 'admin';

  React.useEffect(() => {
    const filters: any = {};
    if (keyword) filters.keyword = keyword;
    if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
    
    if (activeTab === 'pending') {
      filters.status = 'pending';
    } else if (activeTab === 'borrowed') {
      filters.status = 'approved';
    } else if (activeTab === 'returned') {
      // 已归还包含 returned、damaged、rejected
    }
    
    fetchRecords(filters).then(data => {
      if (activeTab === 'returned') {
        data = data.filter(r => ['returned', 'damaged', 'rejected'].includes(r.status));
      }
      setFilteredRecords(data);
    });
  }, [keyword, statusFilter, activeTab, fetchRecords]);

  const pendingCount = records.filter(r => r.status === 'pending').length;
  const borrowedCount = records.filter(r => r.status === 'approved').length;
  const returnedCount = records.filter(r => ['returned', 'damaged'].includes(r.status)).length;
  const overdueCount = records.filter(r => r.status === 'overdue').length;

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedRows(prev => 
      selected ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? filteredRecords.map(r => r.id) : []);
  };

  const handleApprove = async () => {
    if (selectedRows.length === 0) return;
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    approveBorrow(selectedRows);
    setSelectedRows([]);
    setSubmitting(false);
  };

  const handleReject = () => {
    if (selectedRows.length === 0) return;
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return;
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
    {
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
    },
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
      key: 'actions',
      header: '操作',
      accessor: (record: BorrowRecord) => (
        <Button
          size="sm"
          variant="primary"
          icon={<ScanLine className="w-4 h-4" />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            openReturnModal(record.id);
          }}
        >
          归还
        </Button>
      ),
    },
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

  return (
    <PageContainer>
      <PageHeader
        title="审批归还"
        description="处理借用申请、审批管理、资产归还登记"
      />

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
              <p className="text-2xl font-bold mt-1">{borrowedCount}</p>
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

      <div className="bg-white rounded-xl shadow-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[280px]">
            <SearchInput
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={setKeyword}
              placeholder="搜索资产名称、申请人、用途..."
            />
          </div>
          <div className="w-40">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BorrowStatus | 'all')}
            />
          </div>
          {isApprover && activeTab === 'pending' && selectedRows.length > 0 && (
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
          emptyText={
            activeTab === 'pending' ? '暂无待审批申请' :
            activeTab === 'borrowed' ? '暂无借用中资产' : '暂无归还记录'
          }
        />
      </div>

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

export default ApprovalReturnPage;
