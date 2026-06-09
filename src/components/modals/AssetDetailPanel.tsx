import * as React from 'react';
import { useUIStore, useAssetStore, useBorrowStore, useUserStore } from '@/store';
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
  AlertTriangle,
  Eye,
  Pencil,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const AssetDetailPanel: React.FC = () => {
  const { showAssetDetail, activeAssetId, closeAssetDetail, openBorrowModal, openAssetForm, navigateToBorrowRecord } = useUIStore();
  const { getAssetById } = useAssetStore();
  const { fetchRecords, getAssetOccupancy } = useBorrowStore();
  const { currentUser } = useUserStore();
  const [activeTab, setActiveTab] = React.useState<'info' | 'history' | 'timeline'>('info');
  const [borrowHistory, setBorrowHistory] = React.useState<any[]>([]);
  const [occupancy, setOccupancy] = React.useState<any[]>([]);
  const [timelineMonth, setTimelineMonth] = React.useState(new Date());

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isAdmin;

  const asset = activeAssetId ? getAssetById(activeAssetId) : null;

  React.useEffect(() => {
    if (activeAssetId) {
      fetchRecords({ assetId: activeAssetId }).then(setBorrowHistory);
    }
  }, [activeAssetId, fetchRecords]);

  React.useEffect(() => {
    if (activeAssetId) {
      const occ = getAssetOccupancy(activeAssetId, 60);
      setOccupancy(occ);
    }
  }, [activeAssetId, getAssetOccupancy]);

  if (!showAssetDetail || !asset) return null;

  const canBorrow = asset.status === 'available';

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

  const getOccupancyForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return occupancy.filter(r => 
      r.borrowDate <= dateStr && r.expectedReturnDate >= dateStr
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isWithin60Days = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 60);
    return date >= today && date <= futureDate;
  };

  const navigateMonth = (direction: number) => {
    setTimelineMonth(new Date(timelineMonth.getFullYear(), timelineMonth.getMonth() + direction, 1));
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

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
              'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
              activeTab === 'info' ? 'text-primary-600' : 'text-dark-500 hover:text-dark-700'
            )}
          >
            资产信息
            {activeTab === 'info' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
              activeTab === 'timeline' ? 'text-primary-600' : 'text-dark-500 hover:text-dark-700'
            )}
          >
            占用时间轴
            {activeTab === 'timeline' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
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
          {activeTab === 'timeline' ? (
            <div className="p-6 space-y-6">
              <div className="bg-white border border-dark-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-dark-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    未来占用日历（60天）
                  </h5>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={<ChevronLeft className="w-4 h-4" />}
                      onClick={() => navigateMonth(-1)}
                    />
                    <span className="text-sm font-medium text-dark-700 min-w-[80px] text-center">
                      {timelineMonth.getFullYear()}年 {monthNames[timelineMonth.getMonth()]}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={<ChevronRight className="w-4 h-4" />}
                      onClick={() => navigateMonth(1)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-success-500" />
                    <span className="text-dark-600">空闲</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-primary-500" />
                    <span className="text-dark-600">借用中</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-warning-500" />
                    <span className="text-dark-600">待审批</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-danger-500" />
                    <span className="text-dark-600">已逾期</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-dark-200" />
                    <span className="text-dark-600">超出范围</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-0.5 bg-dark-100 rounded-lg overflow-hidden">
                  {weekDays.map((day, index) => (
                    <div
                      key={day}
                      className={cn(
                        'py-2 text-center text-xs font-medium bg-dark-50',
                        index === 0 || index === 6 ? 'text-danger-500' : 'text-dark-600'
                      )}
                    >
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(timelineMonth).map(({ date, isCurrentMonth }, index) => {
                    const dayOccupancy = getOccupancyForDate(date);
                    const past = isPast(date);
                    const withinRange = isWithin60Days(date);
                    const today = isToday(date);

                    return (
                      <div
                        key={index}
                        className={cn(
                          'min-h-[70px] p-1 bg-white relative transition-all',
                          !isCurrentMonth && 'bg-dark-50',
                          past && !today && 'bg-dark-50',
                          !withinRange && !past && 'bg-dark-50/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                            !isCurrentMonth && 'text-dark-300',
                            today && 'bg-primary-500 text-white',
                            past && !today && !isCurrentMonth && 'text-dark-300',
                            !withinRange && !past && !today && 'text-dark-300'
                          )}>
                            {date.getDate()}
                          </span>
                          {withinRange && dayOccupancy.length === 0 && !past && (
                            <CheckCircle2 className="w-3 h-3 text-success-500" />
                          )}
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {dayOccupancy.slice(0, 2).map((r, i) => (
                            <div
                              key={i}
                              className={cn(
                                'text-[10px] px-1 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80',
                                r.status === 'approved' && 'bg-primary-500',
                                r.status === 'pending' && 'bg-warning-500',
                                r.status === 'overdue' && 'bg-danger-500'
                              )}
                              onClick={() => isAdmin && navigateToBorrowRecord(r.id)}
                              title={isAdmin ? `点击查看详情 - ${r.userName} - ${r.purpose}` : `${r.userName} - ${r.purpose}`}
                            >
                              <div className="flex items-center gap-1">
                                <span>{r.userName}</span>
                                {isAdmin && <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />}
                              </div>
                            </div>
                          ))}
                          {dayOccupancy.length > 2 && (
                            <div className="text-[10px] text-dark-500 text-center">
                              +{dayOccupancy.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isAdmin && (
                  <p className="mt-3 text-xs text-dark-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    管理员点击占用记录可跳转到审批归还页查看详情
                  </p>
                )}
              </div>

              <div className="bg-dark-50 rounded-lg p-4">
                <h5 className="font-medium text-dark-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  未来60天占用列表
                </h5>
                {occupancy.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {occupancy.map((record) => (
                      <div
                        key={record.id}
                        className={cn(
                          'p-3 rounded-lg border transition-all',
                          record.status === 'approved' ? 'bg-primary-50 border-primary-200' :
                          record.status === 'pending' ? 'bg-warning-50 border-warning-200' :
                          'bg-danger-50 border-danger-200'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-dark-800">{record.userName}</p>
                              <StatusBadge type="borrow" status={record.status} size="sm" />
                            </div>
                            <p className="text-xs text-dark-500 mb-1">
                              {formatDate(record.borrowDate)} ~ {formatDate(record.expectedReturnDate)}
                            </p>
                            <p className="text-xs text-dark-600 truncate">用途: {record.purpose}</p>
                          </div>
                          {isAdmin && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              icon={<ExternalLink className="w-3.5 h-3.5" />}
                              onClick={() => navigateToBorrowRecord(record.id)}
                              className="flex-shrink-0 ml-2"
                            >
                              查看
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-2" />
                    <p className="text-dark-500">未来60天内暂无占用记录</p>
                    <p className="text-xs text-dark-400 mt-1">该资产当前处于空闲状态</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'info' ? (
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

        {!canEdit && (
          <div className="mx-6 mb-4 bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary-800">只读模式</p>
                <p className="text-xs text-primary-600">
                  您以普通员工身份登录，仅可查看资产详情和申请借用，如需修改请联系管理员。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-dark-100 flex gap-3 flex-shrink-0">
          {canEdit ? (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                icon={<Pencil className="w-4 h-4" />}
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
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                icon={<Eye className="w-4 h-4" />}
                disabled
              >
                仅可查看
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
