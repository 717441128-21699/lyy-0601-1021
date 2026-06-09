import * as React from 'react';
import { useAssetStore, useUIStore, useUserStore } from '@/store';
import { PageContainer, PageHeader } from '@/components/Layout/PageContainer';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AssetCard } from '@/components/ui/AssetCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/utils';
import { Asset, AssetStatus } from '@/types';
import {
  Plus,
  Grid3X3,
  List,
  Filter,
  LayoutGrid,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

const statusOptions: { value: AssetStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'available', label: '可用' },
  { value: 'borrowed', label: '借用中' },
  { value: 'maintenance', label: '维修中' },
  { value: 'scrapped', label: '已报废' },
  { value: 'lost', label: '已丢失' },
];

const AssetLedgerPage: React.FC = () => {
  const { assets, categories, fetchAssets, loading } = useAssetStore();
  const { openAssetForm, openBorrowModal } = useUIStore();
  const { currentUser } = useUserStore();
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [keyword, setKeyword] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<AssetStatus | 'all'>('all');
  const [filteredAssets, setFilteredAssets] = React.useState<Asset[]>([]);

  const isAdmin = currentUser?.role === 'admin';

  React.useEffect(() => {
    const filters: any = {};
    if (keyword) filters.keyword = keyword;
    if (categoryFilter) filters.categoryId = categoryFilter;
    if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
    
    fetchAssets(filters).then(setFilteredAssets);
  }, [keyword, categoryFilter, statusFilter, fetchAssets]);

  const categoryOptions = [
    { value: '', label: '全部分类' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ];

  const statusCounts = React.useMemo(() => {
    return {
      total: assets.length,
      available: assets.filter(a => a.status === 'available').length,
      borrowed: assets.filter(a => a.status === 'borrowed').length,
      maintenance: assets.filter(a => a.status === 'maintenance').length,
    };
  }, [assets]);

  return (
    <PageContainer>
      <PageHeader
        title="资产台账"
        description="管理和查看公司所有可借用资产的详细信息"
      >
        {isAdmin && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => openAssetForm()}
          >
            新增资产
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-card">
          <p className="text-sm text-dark-500">资产总数</p>
          <p className="text-2xl font-bold text-dark-800 mt-1">{statusCounts.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <p className="text-sm text-dark-500">可用资产</p>
          <p className="text-2xl font-bold text-success-600 mt-1">{statusCounts.available}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <p className="text-sm text-dark-500">借用中</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">{statusCounts.borrowed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <p className="text-sm text-dark-500">维修中</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{statusCounts.maintenance}</p>
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
          <div className="w-40">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'all')}
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
                    <div className="flex items-center justify-end gap-2">
                      {asset.status === 'available' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openBorrowModal(asset.id)}
                        >
                          借用
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAssets.length === 0 && (
            <div className="py-12 text-center text-dark-500">
              暂无符合条件的资产
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default AssetLedgerPage;
