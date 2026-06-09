import * as React from 'react';
import { useAssetStore, useUIStore, useUserStore, useBorrowStore } from '@/store';
import { PageContainer, PageHeader } from '@/components/Layout/PageContainer';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AssetCard } from '@/components/ui/AssetCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { cn, formatDate } from '@/utils';
import { Asset, BorrowRecord } from '@/types';
import {
  HandCoins,
  LayoutGrid,
  List,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type TabMode = 'assets' | 'myRequests';

const BorrowRequestPage: React.FC = () => {
  const { assets, categories, fetchAssets, loading } = useAssetStore();
  const { records, fetchRecords } = useBorrowStore();
  const { openBorrowModal } = useUIStore();
  const { currentUser } = useUserStore();
  const [activeTab, setActiveTab] = React.useState<TabMode>('assets');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [keyword, setKeyword] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [filteredAssets, setFilteredAssets] = React.useState<Asset[]>([]);
  const [myRecords, setMyRecords] = React.useState<BorrowRecord[]>([]);

  React.useEffect(() => {
    const filters: any = { status: 'available' };
    if (keyword) filters.keyword = keyword;
    if (categoryFilter) filters.categoryId = categoryFilter;
    
    fetchAssets(filters).then(setFilteredAssets);
  }, [keyword, categoryFilter, fetchAssets]);

  React.useEffect(() => {
    if (currentUser) {
      fetchRecords({ userId: currentUser.id }).then(setMyRecords);
    }
  }, [currentUser, fetchRecords, records]);

  const categoryOptions = [
    { value: '', label: '全部分类' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ];

  const availableAssets = assets.filter(a => a.status === 'available');
  const pendingCount = myRecords.filter(r => r.status === 'pending').length;
  const approvedCount = myRecords.filter(r => r.status === 'approved').length;
  const rejectedCount = myRecords.filter(r => r.status === 'rejected').length;

  const requestColumns = [
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
      key: 'borrowDate',
      header: '借用日期',
      accessor: (record: BorrowRecord) => (
        <div className="text-sm text-dark-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(record.borrowDate)}
          </div>
          <div className="text-xs text-dark-400 mt-1">
            预计归还: {formatDate(record.expectedReturnDate)}
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
      key: 'approverName',
      header: '审批人',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-600">{record.approverName}</p>
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
    {
      key: 'actions',
      header: '操作',
      accessor: (record: BorrowRecord) => (
        record.status === 'pending' ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (confirm('确定要撤销此申请吗？')) {
                // TODO: 实现撤销申请功能
              }
            }}
          >
            撤销
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="借用申请"
        description="搜索可用资产、提交借用申请、查看申请记录"
      />

      <div className="flex gap-1 bg-white rounded-xl shadow-card p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('assets')}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2',
            activeTab === 'assets'
              ? 'bg-primary-500 text-white shadow-md'
              : 'text-dark-600 hover:bg-dark-50'
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          可用资产
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {availableAssets.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('myRequests')}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2',
            activeTab === 'myRequests'
              ? 'bg-primary-500 text-white shadow-md'
              : 'text-dark-600 hover:bg-dark-50'
          )}
        >
          <Clock className="w-4 h-4" />
          我的申请
          {pendingCount > 0 && (
            <span className="bg-warning-500 text-white px-2 py-0.5 rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'assets' ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
              <p className="text-sm text-white/80">可借资产</p>
              <p className="text-2xl font-bold mt-1">{availableAssets.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-card">
              <p className="text-sm text-dark-500">待审批</p>
              <p className="text-2xl font-bold text-warning-600 mt-1 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {pendingCount}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-card">
              <p className="text-sm text-dark-500">已通过</p>
              <p className="text-2xl font-bold text-success-600 mt-1 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {approvedCount}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-card">
              <p className="text-sm text-dark-500">已驳回</p>
              <p className="text-2xl font-bold text-danger-600 mt-1 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {rejectedCount}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[280px]">
                <SearchInput
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onSearch={setKeyword}
                  placeholder="搜索资产名称、编号、责任人..."
                />
              </div>
              <div className="w-48">
                <Select
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1 bg-dark-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-500 hover:text-dark-700'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-500 hover:text-dark-700'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse-soft text-dark-500">加载中...</div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAssets.map((asset, index) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  style={{ animationDelay: `${index * 50}ms` }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-50 border-b border-dark-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      资产信息
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      位置
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      责任人
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-dark-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={asset.imageUrl}
                            alt={asset.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-dark-800">{asset.name}</p>
                            <p className="text-xs text-dark-500">{asset.assetNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-600">{asset.categoryName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge type="asset" status={asset.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-600">{asset.location}</td>
                      <td className="px-4 py-3 text-sm text-dark-600">{asset.managerName}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<HandCoins className="w-4 h-4" />}
                          onClick={() => openBorrowModal(asset.id)}
                        >
                          申请借用
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAssets.length === 0 && (
                <div className="py-12 text-center text-dark-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                  <p>暂无符合条件的可用资产</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <DataTable
            columns={requestColumns}
            data={myRecords}
            loading={loading}
            rowId={(row) => row.id}
            emptyText="暂无申请记录"
          />
        </div>
      )}
    </PageContainer>
  );
};

export default BorrowRequestPage;
