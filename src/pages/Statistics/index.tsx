import * as React from 'react';
import { useAssetStore, useBorrowStore, useUserStore, useUIStore } from '@/store';
import { PageContainer, PageHeader } from '@/components/Layout/PageContainer';
import { StatCard } from '@/components/charts/StatCard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrency, cn } from '@/utils';
import { Asset, BorrowRecord } from '@/types';
import {
  Package,
  HandCoins,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  User,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Filter,
  Bell,
  History,
} from 'lucide-react';

const StatisticsPage: React.FC = () => {
  const { assets, categories } = useAssetStore();
  const { getOverdueRecords, updateOverdueStatus, getRemindersForRecord, getMonthlyStatistics } = useBorrowStore();
  const { departments } = useUserStore();
  const { openReminderModal, openReminderHistoryModal } = useUIStore();
  const { currentUser } = useUserStore();
  const [selectedDepartment, setSelectedDepartment] = React.useState('');
  const [selectedMonth, setSelectedMonth] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const isApprover = currentUser?.role === 'approver' || currentUser?.role === 'admin';

  React.useEffect(() => {
    updateOverdueStatus();
  }, [updateOverdueStatus]);

  const departmentOptions = [
    { value: '', label: '全部部门' },
    ...departments.map(d => ({ value: d.name, label: d.name })),
  ];

  const monthOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: '', label: '全部时间' },
    ];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      options.push({ value, label });
    }
    return options;
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    updateOverdueStatus();
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const defaultMonth = React.useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const effectiveMonth = selectedMonth || defaultMonth;

  const monthlyStats = React.useMemo(() => {
    return getMonthlyStatistics(
      effectiveMonth,
      selectedDepartment || undefined
    );
  }, [getMonthlyStatistics, effectiveMonth, selectedDepartment]);

  const totalAssets = assets.length;
  const availableAssets = assets.filter(a => a.status === 'available').length;
  const borrowedAssets = assets.filter(a => a.status === 'borrowed').length;
  const maintenanceAssets = assets.filter(a => a.status === 'maintenance').length;

  const overdueRecords = React.useMemo(() => {
    if (selectedMonth) {
      return monthlyStats.overdueList;
    }
    return getOverdueRecords({
      department: selectedDepartment || undefined,
    });
  }, [selectedMonth, selectedDepartment, monthlyStats.overdueList, getOverdueRecords]);

  const totalBorrowCount = React.useMemo(() => {
    return monthlyStats.borrowTrend.reduce((sum, item) => sum + item.count, 0);
  }, [monthlyStats.borrowTrend]);

  const monthlyTrend = React.useMemo(() => {
    return monthlyStats.borrowTrend.map(item => ({
      date: item.date.split('-').slice(1).join('/'),
      count: item.count,
    }));
  }, [monthlyStats.borrowTrend]);

  const departmentUsage = React.useMemo(() => {
    const result = monthlyStats.departmentUsage.map(d => ({
      name: d.department,
      value: d.count,
    }));
    
    return selectedDepartment 
      ? result.filter(d => d.name === selectedDepartment)
      : result;
  }, [monthlyStats.departmentUsage, selectedDepartment]);

  const categoryDistribution = React.useMemo(() => {
    return categories.map(c => ({
      name: c.name,
      value: assets.filter(a => a.categoryId === c.id).length,
    })).filter(c => c.value > 0);
  }, [assets, categories]);

  const idleAssets = React.useMemo(() => {
    return monthlyStats.idleAssets
      .map(item => item.asset)
      .slice(0, 10);
  }, [monthlyStats.idleAssets]);

  const idleAssetDays = React.useMemo(() => {
    const map = new Map<string, number>();
    monthlyStats.idleAssets.forEach(item => {
      map.set(item.asset.id, item.daysIdle);
    });
    return map;
  }, [monthlyStats.idleAssets]);

  const damagedRecords = React.useMemo(() => {
    const [year, month] = effectiveMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    
    let records = monthlyStats.overdueList.concat(
      monthlyStats.borrowTrend.flatMap(() => [])
    );
    
    const allRecords = getOverdueRecords().concat(
      monthlyStats.overdueList
    ).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    
    return allRecords
      .filter(r => {
        if (selectedMonth) {
          return r.actualReturnDate && 
                 r.actualReturnDate >= monthStart && 
                 r.actualReturnDate <= monthEnd;
        }
        return r.damageLevel !== 'none' && r.damageLevel !== undefined;
      })
      .filter(r => r.damageLevel !== 'none' && r.damageLevel !== undefined)
      .sort((a, b) => new Date(b.actualReturnDate || b.createdAt).getTime() - new Date(a.actualReturnDate || a.createdAt).getTime())
      .slice(0, 10);
  }, [effectiveMonth, selectedMonth, monthlyStats.overdueList, getOverdueRecords]);

  const overdueColumns = [
    {
      key: 'assetName',
      header: '资产信息',
      accessor: (record: BorrowRecord) => {
        const asset = assets.find(a => a.id === record.assetId);
        return (
          <div className="flex items-center gap-3">
            {asset && (
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="font-medium text-dark-800">{record.assetName}</p>
              <p className="text-xs text-dark-500">{record.assetNo}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'userName',
      header: '借用人',
      accessor: (record: BorrowRecord) => (
        <div className="text-sm">
          <p className="text-dark-700">{record.userName}</p>
          <p className="text-xs text-dark-500">{record.userDepartment}</p>
        </div>
      ),
    },
    {
      key: 'expectedReturnDate',
      header: '应归还日期',
      accessor: (record: BorrowRecord) => {
        const today = new Date();
        const expected = new Date(record.expectedReturnDate);
        const daysOverdue = Math.ceil((today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="text-sm">
            <p className="text-dark-700">{formatDate(record.expectedReturnDate)}</p>
            <p className="text-xs text-danger-600 font-medium">已逾期 {daysOverdue} 天</p>
          </div>
        );
      },
    },
    {
      key: 'purpose',
      header: '用途',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-600 truncate max-w-xs">{record.purpose}</p>
      ),
    },
    {
      key: 'reminders',
      header: '催还次数',
      accessor: (record: BorrowRecord) => {
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
    {
      key: 'status',
      header: '状态',
      accessor: (record: BorrowRecord) => (
        <StatusBadge type="borrow" status={record.status} size="sm" />
      ),
    },
    ...(isApprover ? [{
      key: 'actions',
      header: '操作',
      accessor: (record: BorrowRecord) => (
        <div className="flex items-center gap-2">
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
        </div>
      ),
    }] : []),
  ];

  const idleColumns = [
    {
      key: 'name',
      header: '资产信息',
      accessor: (asset: Asset) => (
        <div className="flex items-center gap-3">
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <p className="font-medium text-dark-800">{asset.name}</p>
            <p className="text-xs text-dark-500">{asset.assetNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'categoryName',
      header: '分类',
      accessor: (asset: Asset) => (
        <p className="text-sm text-dark-600">{asset.categoryName}</p>
      ),
    },
    {
      key: 'location',
      header: '位置',
      accessor: (asset: Asset) => (
        <div className="flex items-center gap-1 text-sm text-dark-600">
          <MapPin className="w-3.5 h-3.5" />
          {asset.location}
        </div>
      ),
    },
    {
      key: 'managerName',
      header: '责任人',
      accessor: (asset: Asset) => (
        <div className="flex items-center gap-1 text-sm text-dark-600">
          <User className="w-3.5 h-3.5" />
          {asset.managerName}
        </div>
      ),
    },
    {
      key: 'daysIdle',
      header: '闲置天数',
      accessor: (asset: Asset) => {
        const days = idleAssetDays.get(asset.id) || 0;
        return (
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            days >= 30 ? 'bg-danger-100 text-danger-700' : 
            days >= 15 ? 'bg-warning-100 text-warning-700' : 
            'bg-dark-100 text-dark-600'
          )}>
            {days} 天
          </span>
        );
      },
    },
    {
      key: 'purchasePrice',
      header: '价值',
      accessor: (asset: Asset) => (
        <p className="text-sm font-medium text-dark-700">{formatCurrency(asset.purchasePrice)}</p>
      ),
    },
    {
      key: 'status',
      header: '状态',
      accessor: (asset: Asset) => (
        <StatusBadge type="asset" status={asset.status} size="sm" />
      ),
    },
  ];

  const damagedColumns = [
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
      header: '借用人',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-600">{record.userName}</p>
      ),
    },
    {
      key: 'damageLevel',
      header: '损坏程度',
      accessor: (record: BorrowRecord) => {
        const damageLabels: Record<string, string> = {
          minor: '轻微损坏',
          moderate: '中等损坏',
          severe: '严重损坏',
        };
        const damageColors: Record<string, string> = {
          minor: 'bg-warning-100 text-warning-700',
          moderate: 'bg-primary-100 text-primary-700',
          severe: 'bg-danger-100 text-danger-700',
        };
        return (
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            damageColors[record.damageLevel]
          )}>
            {damageLabels[record.damageLevel]}
          </span>
        );
      },
    },
    {
      key: 'repairCost',
      header: '维修费用',
      accessor: (record: BorrowRecord) => (
        <div className="flex items-center gap-1 text-sm text-danger-600 font-medium">
          <DollarSign className="w-3.5 h-3.5" />
          {formatCurrency(record.repairCost)}
        </div>
      ),
    },
    {
      key: 'damageNote',
      header: '损坏说明',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-600 truncate max-w-xs" title={record.damageNote}>
          {record.damageNote || '-'}
        </p>
      ),
    },
    {
      key: 'actualReturnDate',
      header: '归还日期',
      accessor: (record: BorrowRecord) => (
        <p className="text-sm text-dark-500">
          {record.actualReturnDate ? formatDate(record.actualReturnDate) : '-'}
        </p>
      ),
    },
  ];

  const filterSummary = React.useMemo(() => {
    const parts: string[] = [];
    if (selectedDepartment) {
      parts.push(`部门：${selectedDepartment}`);
    }
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      parts.push(`时间：${year}年${month}月`);
    }
    return parts.length > 0 ? parts.join(' · ') : '全部数据';
  }, [selectedDepartment, selectedMonth]);

  return (
    <PageContainer>
      <PageHeader
        title="统计中心"
        description="资产借用数据统计、分析和可视化展示"
      >
        <Button
          variant="secondary"
          icon={<RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />}
          onClick={handleRefresh}
          loading={isRefreshing}
        >
          刷新数据
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl shadow-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-dark-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">筛选条件：</span>
          </div>
          <div className="w-48">
            <Select
              options={departmentOptions}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              options={monthOptions}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          {(selectedDepartment || selectedMonth) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedDepartment('');
                setSelectedMonth('');
              }}
            >
              清除筛选
            </Button>
          )}
          <div className="ml-auto text-sm text-dark-500">
            当前筛选：<span className="font-medium text-dark-700">{filterSummary}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="资产总数"
          value={totalAssets}
          icon={Package}
          trend={8.5}
          trendLabel="较上月"
          color="blue"
          delay={0}
        />
        <StatCard
          title={`${effectiveMonth.split('-')[0]}年${effectiveMonth.split('-')[1]}月借用`}
          value={totalBorrowCount}
          icon={HandCoins}
          trend={12.3}
          trendLabel="较上月"
          color="green"
          delay={100}
        />
        <StatCard
          title={selectedMonth ? `${effectiveMonth.split('-')[0]}年${effectiveMonth.split('-')[1]}月逾期` : '逾期未还'}
          value={overdueRecords.length}
          icon={AlertTriangle}
          trend={-5.2}
          trendLabel="较上月"
          color="red"
          delay={200}
        />
        <StatCard
          title={`${effectiveMonth.split('-')[0]}年${effectiveMonth.split('-')[1]}月闲置（90天）`}
          value={idleAssets.length}
          icon={Clock}
          trend={3.1}
          trendLabel="较上月"
          color="orange"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">可用资产</p>
              <p className="text-xl font-bold text-dark-800">{availableAssets}</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-dark-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success-500 rounded-full transition-all duration-500"
              style={{ width: `${(availableAssets / totalAssets) * 100}%` }}
            />
          </div>
          <p className="text-xs text-dark-500 mt-2">
            占比 {((availableAssets / totalAssets) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
              <HandCoins className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">借用中</p>
              <p className="text-xl font-bold text-dark-800">{borrowedAssets}</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-dark-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-warning-500 rounded-full transition-all duration-500"
              style={{ width: `${(borrowedAssets / totalAssets) * 100}%` }}
            />
          </div>
          <p className="text-xs text-dark-500 mt-2">
            占比 {((borrowedAssets / totalAssets) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">维修中</p>
              <p className="text-xl font-bold text-dark-800">{maintenanceAssets}</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-dark-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${(maintenanceAssets / totalAssets) * 100}%` }}
            />
          </div>
          <p className="text-xs text-dark-500 mt-2">
            占比 {((maintenanceAssets / totalAssets) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <LineChart 
          data={monthlyTrend} 
          title={`${effectiveMonth.split('-')[0]}年${effectiveMonth.split('-')[1]}月 ${selectedDepartment ? selectedDepartment + ' - ' : ''}借用趋势`} 
          height={300} 
        />
        <BarChart 
          data={departmentUsage} 
          title={`${effectiveMonth.split('-')[0]}年${effectiveMonth.split('-')[1]}月 ${selectedDepartment ? selectedDepartment + ' - ' : ''}部门使用排行`} 
          height={300} 
          color="#10b981" 
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-1">
          <PieChart data={categoryDistribution} title="资产分类分布" height={300} />
        </div>
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4 font-display">资产分类明细</h3>
          <div className="space-y-3">
            {categoryDistribution.map((cat, index) => {
              const maxValue = Math.max(...categoryDistribution.map(c => c.value));
              const percentage = (cat.value / totalAssets) * 100;
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
              
              return (
                <div key={cat.name} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <div className="w-24 text-sm text-dark-700">{cat.name}</div>
                  <div className="flex-1 h-6 bg-dark-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(cat.value / maxValue) * 100}%`,
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-semibold text-dark-800">{cat.value}</span>
                    <span className="text-xs text-dark-500 ml-1">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger-500" />
            <h3 className="text-lg font-semibold text-dark-800 font-display">
              逾期名单
              <span className="text-sm font-normal text-dark-500 ml-2">
                （{[
                  selectedDepartment && selectedDepartment, 
                  `${effectiveMonth.split('-')[0]}年${effectiveMonth.split('-')[1]}月`
                ].filter(Boolean).join(' · ')}）
              </span>
            </h3>
            {overdueRecords.length > 0 && (
              <span className="bg-danger-100 text-danger-600 px-2 py-0.5 rounded-full text-xs font-medium">
                {overdueRecords.length} 项
              </span>
            )}
          </div>
        </div>
        <DataTable
          columns={overdueColumns}
          data={overdueRecords}
          pagination={false}
          rowId={(row) => row.id}
          emptyText={selectedDepartment ? `${selectedDepartment}暂无逾期记录` : '暂无逾期记录'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning-500" />
              <h3 className="text-lg font-semibold text-dark-800 font-display">
                闲置资产
                <span className="text-sm font-normal text-dark-500 ml-2">
                  （90天未使用 · ${effectiveMonth.split('-')[0]}年${effectiveMonth.split('-')[1]}月）
                </span>
              </h3>
            </div>
          </div>
          <DataTable
            columns={idleColumns}
            data={idleAssets}
            pagination={false}
            rowId={(row) => row.id}
            emptyText="暂无闲置资产"
          />
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger-500" />
              <h3 className="text-lg font-semibold text-dark-800 font-display">
                损坏记录
                {selectedDepartment && <span className="text-sm font-normal text-dark-500 ml-2">（{selectedDepartment}）</span>}
              </h3>
            </div>
          </div>
          <DataTable
            columns={damagedColumns}
            data={damagedRecords}
            pagination={false}
            rowId={(row) => row.id}
            emptyText={selectedDepartment ? `${selectedDepartment}暂无损坏记录` : '暂无损坏记录'}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default StatisticsPage;
