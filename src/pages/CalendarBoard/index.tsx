import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetStore, useBorrowStore, useUIStore } from '@/store';
import { PageContainer, PageHeader } from '@/components/Layout/PageContainer';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatDate } from '@/utils';
import { Asset, BorrowRecord, CalendarView, BatchConflictInfo } from '@/types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  User,
  CheckCircle,
  LayoutGrid,
  List,
  MapPin,
  Layers,
  ExternalLink,
  Users,
  Package,
  AlertCircle,
} from 'lucide-react';

const CalendarBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const { assets, categories, fetchAssets } = useAssetStore();
  const { records, fetchRecords, getBatches, checkBatchConflicts } = useBorrowStore();
  const { navigateToBorrowRecord, setSelectedBatchId } = useUIStore();
  const [viewMode, setViewMode] = React.useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedAssetId, setSelectedAssetId] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('');
  const [filteredAssets, setFilteredAssets] = React.useState<Asset[]>([]);
  const [activeRecords, setActiveRecords] = React.useState<BorrowRecord[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = React.useState<BorrowRecord | null>(null);
  const { selectedBatchId } = useUIStore();
  const [batchConflicts, setBatchConflicts] = React.useState<BatchConflictInfo[]>([]);

  React.useEffect(() => {
    const filters: any = {};
    if (selectedCategoryId) filters.categoryId = selectedCategoryId;
    fetchAssets(filters).then(setFilteredAssets);
  }, [selectedCategoryId, fetchAssets]);

  React.useEffect(() => {
    fetchRecords().then(allRecords => {
      let filtered = allRecords.filter(r => ['approved', 'pending', 'overdue'].includes(r.status));
      if (selectedAssetId) {
        filtered = filtered.filter(r => r.assetId === selectedAssetId);
      }
      setActiveRecords(filtered);
    });
  }, [selectedAssetId, fetchRecords, records]);

  React.useEffect(() => {
    if (viewMode === 'batch') {
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const conflicts = checkBatchConflicts(monthStr);
      setBatchConflicts(conflicts);
    }
  }, [viewMode, currentDate, checkBatchConflicts]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const days: { date: Date }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({ date: d });
    }
    return days;
  };

  const getRecordsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return activeRecords.filter(r => {
      return r.borrowDate <= dateStr && r.expectedReturnDate >= dateStr;
    });
  };

  const hasConflict = (date: Date) => {
    const records = getRecordsForDate(date);
    const assetGroups = records.reduce((acc, r) => {
      acc[r.assetId] = (acc[r.assetId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.values(assetGroups).some(count => count > 1);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const assetOptions = [
    { value: '', label: '全部资产' },
    ...filteredAssets.map(a => ({ value: a.id, label: `${a.name} (${a.assetNo})` })),
  ];

  const categoryOptions = [
    { value: '', label: '全部分类' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getRecordColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-primary-500';
      case 'pending': return 'bg-warning-500';
      case 'overdue': return 'bg-danger-500';
      default: return 'bg-dark-500';
    }
  };

  const handleNavigateToApproval = (batchId: string) => {
    setSelectedBatchId(batchId);
    navigate('/approval');
  };

  const handleNavigateToRecord = (recordId: string, assetId: string) => {
    navigateToBorrowRecord(recordId, assetId);
    navigate('/approval');
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const today = new Date();

    return (
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="grid grid-cols-7 bg-dark-50 border-b border-dark-100">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                'py-3 text-center text-sm font-medium',
                index === 0 || index === 6 ? 'text-danger-500' : 'text-dark-600'
              )}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map(({ date, isCurrentMonth }, index) => {
            const dayRecords = getRecordsForDate(date);
            const conflict = hasConflict(date);
            const dateStr = formatDate(date);
            const isSelected = selectedDate === dateStr;

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={cn(
                  'min-h-[120px] p-2 border-b border-r border-dark-100 cursor-pointer transition-colors',
                  !isCurrentMonth && 'bg-dark-50',
                  isSelected && 'bg-primary-50',
                  'hover:bg-dark-50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    !isCurrentMonth && 'text-dark-300',
                    isToday(date) && 'bg-primary-500 text-white',
                    conflict && isCurrentMonth && !isToday(date) && 'bg-danger-100 text-danger-600'
                  )}>
                    {date.getDate()}
                  </span>
                  {conflict && isCurrentMonth && (
                    <AlertTriangle className="w-4 h-4 text-danger-500" />
                  )}
                </div>
                <div className="space-y-1">
                  {dayRecords.slice(0, 2).map(record => (
                    <div
                      key={record.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(record);
                      }}
                      className={cn(
                        'text-xs p-1.5 rounded truncate text-white cursor-pointer hover:opacity-90 transition-opacity',
                        getRecordColor(record.status)
                      )}
                      title={`${record.assetName} - ${record.userName}`}
                    >
                      <span className="truncate block">{record.assetName}</span>
                    </div>
                  ))}
                  {dayRecords.length > 2 && (
                    <div className="text-xs text-dark-500 text-center">
                      +{dayRecords.length - 2} 更多
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays(currentDate);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    return (
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="grid grid-cols-8 bg-dark-50 border-b border-dark-100">
          <div className="py-3 px-2 text-center text-sm font-medium text-dark-600 border-r border-dark-100">
            时间
          </div>
          {days.map(({ date }, index) => (
            <div
              key={index}
              className={cn(
                'py-3 text-center border-r border-dark-100 last:border-r-0',
                index === 0 || index === 6 ? 'text-danger-500' : 'text-dark-600'
              )}
            >
              <div className="text-sm font-medium">{weekDays[index]}</div>
              <div className={cn(
                'text-lg font-bold mt-1',
                isToday(date) && 'text-primary-500'
              )}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="divide-y divide-dark-100">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8">
              <div className="py-4 px-2 text-sm text-dark-500 text-center border-r border-dark-100">
                {hour}:00
              </div>
              {days.map(({ date }, dayIndex) => {
                const dayRecords = getRecordsForDate(date);
                return (
                  <div
                    key={dayIndex}
                    className="py-2 px-1 border-r border-dark-100 last:border-r-0 min-h-[60px]"
                  >
                    {dayRecords.map(record => (
                      <div
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className={cn(
                          'text-xs p-1.5 rounded mb-1 truncate text-white cursor-pointer hover:opacity-90',
                          getRecordColor(record.status)
                        )}
                        title={`${record.assetName} - ${record.userName}`}
                      >
                        {record.assetName}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const sortedRecords = [...activeRecords].sort((a, b) => 
      new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime()
    );

    return (
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-50 border-b border-dark-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                资产信息
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                借用人
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                借用周期
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                用途
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                位置
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {sortedRecords.map(record => {
              const asset = filteredAssets.find(a => a.id === record.assetId);
              return (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="hover:bg-dark-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="text-dark-700">{record.userName}</p>
                      <p className="text-xs text-dark-500">{record.userDepartment}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-dark-600">
                      <p>{formatDate(record.borrowDate)}</p>
                      <p className="text-xs text-dark-400">至 {formatDate(record.expectedReturnDate)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-dark-600 truncate max-w-xs">{record.purpose}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge type="borrow" status={record.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-dark-600">
                      <MapPin className="w-3.5 h-3.5" />
                      {asset?.location || '-'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedRecords.length === 0 && (
          <div className="py-12 text-center text-dark-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-dark-300" />
            <p>暂无借用记录</p>
          </div>
        )}
      </div>
    );
  };

  const renderBatchView = () => {
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const batches = getBatches({ month: monthStr });
    
    const conflictMap = new Map<string, BatchConflictInfo[]>();
    batchConflicts.forEach(conflict => {
      const key = `${conflict.date}-${conflict.assetId}`;
      if (!conflictMap.has(key)) {
        conflictMap.set(key, []);
      }
      conflictMap.get(key)!.push(conflict);
    });

    const hasBatchConflict = (batchId: string) => {
      return batchConflicts.some(c => c.batchId === batchId);
    };

    return (
      <div className="space-y-6">
        {batchConflicts.length > 0 && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-danger-800">跨批次占用冲突预警</h4>
                <p className="text-sm text-danger-600 mt-0.5">
                  发现 {new Set(batchConflicts.map(c => c.date + c.assetId)).size} 个冲突点，涉及 {new Set(batchConflicts.map(c => c.batchId)).size} 个批次
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(conflictMap.entries()).slice(0, 6).map(([key, conflicts]) => {
                const [date, assetId] = key.split('-');
                const asset = assets.find(a => a.id === assetId);
                return (
                  <div
                    key={key}
                    className="bg-white border border-danger-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-danger-700 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {date}
                      </span>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<ExternalLink className="w-3 h-3" />}
                        onClick={() => handleNavigateToApproval(conflicts[0].batchId)}
                      >
                        处理
                      </Button>
                    </div>
                    <p className="text-sm text-dark-700 font-medium mb-2">
                      {asset?.name || conflicts[0].assetName}
                    </p>
                    <div className="space-y-1">
                      {conflicts.map((c, i) => (
                        <div
                          key={i}
                          className="text-xs text-dark-600 flex items-center justify-between"
                        >
                          <span className="truncate">
                            {c.batchPurpose} - {c.userName}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs h-6 px-2 py-0"
                            onClick={() => handleNavigateToRecord(
                              getBatchRecords(c.batchId).find(r => r.assetId === assetId)?.id || '',
                              assetId
                            )}
                          >
                            查看
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-dark-100 bg-dark-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-dark-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-500" />
                会议批次列表
                <span className="text-sm font-normal text-dark-500">
                  ({monthNames[currentDate.getMonth()]}月，共 {batches.length} 个批次)
                </span>
              </h3>
            </div>
          </div>

          {batches.length === 0 ? (
            <div className="py-12 text-center text-dark-500">
              <Layers className="w-12 h-12 mx-auto mb-3 text-dark-300" />
              <p>当月暂无会议批次</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-100">
              {batches.map(batch => {
                const hasConflict = hasBatchConflict(batch.batchId);
                const pendingCount = batch.records.filter(r => r.status === 'pending').length;
                const approvedCount = batch.records.filter(r => ['approved', 'overdue'].includes(r.status)).length;
                const rejectedCount = batch.records.filter(r => r.status === 'rejected').length;
                const returnedCount = batch.records.filter(r => ['returned', 'damaged'].includes(r.status)).length;

                return (
                  <div
                    key={batch.batchId}
                    className={cn(
                      'p-4 hover:bg-dark-50 transition-colors',
                      hasConflict && 'bg-danger-50/30'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-dark-800">{batch.purpose}</h4>
                          {hasConflict && (
                            <span className="flex items-center gap-1 text-xs bg-danger-100 text-danger-700 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              存在冲突
                            </span>
                          )}
                          <span className="text-xs bg-dark-100 text-dark-600 px-2 py-0.5 rounded-full">
                            {batch.records.length} 件资产
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-dark-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
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

                        <div className="flex items-center gap-4">
                          {pendingCount > 0 && (
                            <span className="text-xs bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full">
                              待审批 {pendingCount}
                            </span>
                          )}
                          {approvedCount > 0 && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                              借用中 {approvedCount}
                            </span>
                          )}
                          {rejectedCount > 0 && (
                            <span className="text-xs bg-danger-100 text-danger-700 px-2 py-0.5 rounded-full">
                              已驳回 {rejectedCount}
                            </span>
                          )}
                          {returnedCount > 0 && (
                            <span className="text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
                              已归还 {returnedCount}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {batch.records.slice(0, 5).map((record, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 bg-dark-50 rounded-lg px-2 py-1"
                            >
                              <Package className="w-3.5 h-3.5 text-dark-400" />
                              <span className="text-xs text-dark-600 truncate max-w-[120px]">
                                {record.assetName}
                              </span>
                              <StatusBadge type="borrow" status={record.status} size="sm" />
                            </div>
                          ))}
                          {batch.records.length > 5 && (
                            <span className="text-xs text-dark-500">
                              +{batch.records.length - 5} 件
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        {hasConflict && (
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<AlertTriangle className="w-3.5 h-3.5" />}
                            onClick={() => handleNavigateToApproval(batch.batchId)}
                          >
                            处理冲突
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                          onClick={() => handleNavigateToApproval(batch.batchId)}
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getBatchRecords = (batchId: string) => {
    return records.filter(r => r.batchId === batchId);
  };

  return (
    <PageContainer>
      <PageHeader
        title="日历看板"
        description="查看资产借用时间安排、检测占用冲突"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-card">
          <p className="text-sm text-dark-500">今日借用</p>
          <p className="text-2xl font-bold text-primary-600 mt-1 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {getRecordsForDate(new Date()).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <p className="text-sm text-dark-500">本周借用</p>
          <p className="text-2xl font-bold text-success-600 mt-1 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {(() => {
              const weekDays = getWeekDays(new Date());
              const records = new Set<string>();
              weekDays.forEach(({ date }) => {
                getRecordsForDate(date).forEach(r => records.add(r.id));
              });
              return records.size;
            })()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <p className="text-sm text-dark-500">进行中</p>
          <p className="text-2xl font-bold text-warning-600 mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {activeRecords.filter(r => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <p className="text-sm text-dark-500">冲突预警</p>
          <p className="text-2xl font-bold text-danger-600 mt-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {(() => {
              const monthDays = getDaysInMonth(new Date());
              let conflictCount = 0;
              monthDays.forEach(({ date, isCurrentMonth }) => {
                if (isCurrentMonth && hasConflict(date)) conflictCount++;
              });
              return conflictCount;
            })()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<ChevronLeft className="w-4 h-4" />}
              onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={goToToday}
            >
              今天
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<ChevronRight className="w-4 h-4" />}
              onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
            />
            <span className="text-lg font-semibold text-dark-800 ml-2">
              {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
            </span>
          </div>

          <div className="w-48">
            <Select
              options={categoryOptions}
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </div>
          <div className="w-56">
            <Select
              options={assetOptions}
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 bg-dark-100 rounded-lg p-1 ml-auto">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                viewMode === 'month' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-500 hover:text-dark-700'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              月视图
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                viewMode === 'week' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-500 hover:text-dark-700'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              周视图
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-500 hover:text-dark-700'
              )}
            >
              <List className="w-3.5 h-3.5" />
              列表
            </button>
            <button
              onClick={() => setViewMode('batch')}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                viewMode === 'batch' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-500 hover:text-dark-700'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              会议视角
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-dark-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-sm text-dark-600">已批准</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-warning-500" />
            <span className="text-sm text-dark-600">待审批</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-danger-500" />
            <span className="text-sm text-dark-600">已逾期</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger-500" />
            <span className="text-sm text-dark-600">占用冲突</span>
          </div>
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'batch' && renderBatchView()}

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-slide-up">
            <div className="p-6 border-b border-dark-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark-800">借用详情</h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 hover:bg-dark-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-dark-400 rotate-45" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                {filteredAssets.find(a => a.id === selectedRecord.assetId) && (
                  <img
                    src={filteredAssets.find(a => a.id === selectedRecord.assetId)!.imageUrl}
                    alt={selectedRecord.assetName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-dark-800">{selectedRecord.assetName}</h4>
                  <p className="text-sm text-dark-500">{selectedRecord.assetNo}</p>
                  <StatusBadge type="borrow" status={selectedRecord.status} size="sm" className="mt-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-1">借用人</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-dark-400" />
                    <span className="text-sm font-medium text-dark-800">{selectedRecord.userName}</span>
                  </div>
                  <p className="text-xs text-dark-500 mt-1">{selectedRecord.userDepartment}</p>
                </div>
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-1">审批人</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-dark-400" />
                    <span className="text-sm font-medium text-dark-800">{selectedRecord.approverName}</span>
                  </div>
                </div>
              </div>
              <div className="bg-dark-50 rounded-lg p-3">
                <p className="text-xs text-dark-500 mb-1">借用周期</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-dark-400" />
                  <span className="text-sm font-medium text-dark-800">
                    {formatDate(selectedRecord.borrowDate)} 至 {formatDate(selectedRecord.expectedReturnDate)}
                  </span>
                </div>
              </div>
              <div className="bg-dark-50 rounded-lg p-3">
                <p className="text-xs text-dark-500 mb-1">用途说明</p>
                <p className="text-sm text-dark-700">{selectedRecord.purpose}</p>
              </div>
            </div>
            <div className="p-6 border-t border-dark-100 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setSelectedRecord(null)}
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default CalendarBoardPage;
