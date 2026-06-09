import * as React from 'react';
import { useUIStore, useAssetStore, useBorrowStore, useUserStore } from '@/store';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, cn } from '@/utils';
import { AssetConflictInfo } from '@/types';
import { 
  CalendarIcon, HandCoins, AlertCircle, CheckCircle2, User, Clock,
  ChevronLeft, ChevronRight, AlertTriangle, Package, Check, X,
  Layers, ListChecks
} from 'lucide-react';

type Mode = 'single' | 'multi';

export const BorrowModal: React.FC = () => {
  const { showBorrowModal, borrowModalAssetId, closeBorrowModal } = useUIStore();
  const { getAssetById, assets } = useAssetStore();
  const { createBorrowRequest, createMultiBorrowRequest, fetchRecords, getAssetOccupancy, checkDateConflict, checkMultiDateConflict } = useBorrowStore();
  const { currentUser } = useUserStore();
  const [mode, setMode] = React.useState<Mode>('single');
  const [selectedAssetId, setSelectedAssetId] = React.useState(borrowModalAssetId || '');
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);
  const [borrowDate, setBorrowDate] = React.useState(formatDate(new Date()));
  const [expectedReturnDate, setExpectedReturnDate] = React.useState(formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [purpose, setPurpose] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<{ type: 'single' | 'multi'; success: number; failed: AssetConflictInfo[] } | null>(null);
  const [calendarMonth, setCalendarMonth] = React.useState(new Date());
  const [conflicts, setConflicts] = React.useState<{ date: string; records: any[] }[]>([]);
  const [multiConflicts, setMultiConflicts] = React.useState<AssetConflictInfo[]>([]);
  const [occupancy, setOccupancy] = React.useState<any[]>([]);

  const asset = selectedAssetId ? getAssetById(selectedAssetId) : null;
  const availableAssets = assets.filter(a => a.status === 'available');

  React.useEffect(() => {
    if (borrowModalAssetId) {
      setSelectedAssetId(borrowModalAssetId);
      setMode('single');
      setSelectedAssetIds([]);
    }
  }, [borrowModalAssetId]);

  React.useEffect(() => {
    if (mode === 'single' && selectedAssetId) {
      const occ = getAssetOccupancy(selectedAssetId);
      setOccupancy(occ);
    } else {
      setOccupancy([]);
    }
  }, [selectedAssetId, getAssetOccupancy, mode]);

  React.useEffect(() => {
    if (mode === 'single' && selectedAssetId && borrowDate && expectedReturnDate) {
      const conf = checkDateConflict(selectedAssetId, borrowDate, expectedReturnDate);
      setConflicts(conf);
    } else {
      setConflicts([]);
    }
  }, [selectedAssetId, borrowDate, expectedReturnDate, checkDateConflict, mode]);

  React.useEffect(() => {
    if (mode === 'multi' && selectedAssetIds.length > 0 && borrowDate && expectedReturnDate) {
      const confs = checkMultiDateConflict(selectedAssetIds, borrowDate, expectedReturnDate);
      setMultiConflicts(confs);
    } else {
      setMultiConflicts([]);
    }
  }, [selectedAssetIds, borrowDate, expectedReturnDate, checkMultiDateConflict, mode]);

  const handleClose = () => {
    closeBorrowModal();
    setPurpose('');
    setBorrowDate(formatDate(new Date()));
    setExpectedReturnDate(formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    setSuccess(null);
    setConflicts([]);
    setMultiConflicts([]);
    setSelectedAssetIds([]);
    setMode('single');
  };

  const handleToggleAsset = (assetId: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssetIds.length === availableAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(availableAssets.map(a => a.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || !isDateValid) return;

    if (mode === 'single') {
      if (!selectedAssetId || conflicts.length > 0) return;
    } else {
      if (selectedAssetIds.length === 0) return;
    }

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (mode === 'single') {
      createBorrowRequest({
        assetId: selectedAssetId,
        borrowDate,
        expectedReturnDate,
        purpose: purpose.trim(),
      });
      
      fetchRecords();
      setSubmitting(false);
      setSuccess({ type: 'single', success: 1, failed: [] });
    } else {
      const conflictAssetIds = new Set(multiConflicts.map(c => c.assetId));
      const validAssetIds = selectedAssetIds.filter(id => !conflictAssetIds.has(id));
      
      if (validAssetIds.length > 0) {
        const result = createMultiBorrowRequest({
          assetIds: validAssetIds,
          borrowDate,
          expectedReturnDate,
          purpose: purpose.trim(),
        });
        
        fetchRecords();
        setSubmitting(false);
        setSuccess({ 
          type: 'multi', 
          success: result.success.length, 
          failed: result.failed 
        });
      } else {
        setSubmitting(false);
        setSuccess({ 
          type: 'multi', 
          success: 0, 
          failed: multiConflicts 
        });
      }
    }
    
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const isDateValid = new Date(expectedReturnDate) > new Date(borrowDate);
  const hasAnyConflict = mode === 'single' ? conflicts.length > 0 : multiConflicts.length > 0;
  const canSubmit = mode === 'single' 
    ? (selectedAssetId && purpose.trim() && isDateValid && conflicts.length === 0)
    : (selectedAssetIds.length > 0 && purpose.trim() && isDateValid);

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

  const isInSelectedRange = (date: Date) => {
    const dateStr = formatDate(date);
    return dateStr >= borrowDate && dateStr <= expectedReturnDate;
  };

  const isConflictDate = (date: Date) => {
    const dateStr = formatDate(date);
    return conflicts.some(c => c.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const navigateMonth = (direction: number) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + direction, 1));
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const getAssetConflictInfo = (assetId: string) => {
    return multiConflicts.find(c => c.assetId === assetId);
  };

  if (success) {
    return (
      <Modal open={showBorrowModal} onClose={handleClose} hideCloseButton>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-success-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <h3 className="text-xl font-bold text-dark-800 mb-2 font-display">申请提交成功</h3>
          <p className="text-dark-500 mb-4">
            {success.type === 'single' 
              ? '您的借用申请已提交，等待审批人审批'
              : `成功提交 ${success.success} 项申请`
            }
          </p>
          {success.type === 'multi' && success.failed.length > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm font-medium text-warning-800 mb-2">以下资产因日期冲突未能提交：</p>
              <div className="space-y-1">
                {success.failed.slice(0, 3).map((f, i) => (
                  <p key={i} className="text-xs text-warning-700">
                    • {f.assetName}（{f.conflicts.length}天冲突）
                  </p>
                ))}
                {success.failed.length > 3 && (
                  <p className="text-xs text-warning-600">...还有 {success.failed.length - 3} 项</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={showBorrowModal}
      onClose={handleClose}
      title="申请借用资产"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-2 bg-dark-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
              mode === 'single' ? 'bg-white text-primary-600 shadow-sm' : 'text-dark-600 hover:text-dark-800'
            )}
          >
            <Package className="w-4 h-4" />
            单资产申请
          </button>
          <button
            type="button"
            onClick={() => setMode('multi')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
              mode === 'multi' ? 'bg-white text-primary-600 shadow-sm' : 'text-dark-600 hover:text-dark-800'
            )}
          >
            <Layers className="w-4 h-4" />
            多资产申请
          </button>
        </div>

        {mode === 'single' && asset && (
          <div className="bg-dark-50 rounded-lg p-4 flex items-start gap-4">
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-dark-800">{asset.name}</h4>
                <StatusBadge type="asset" status={asset.status} size="sm" />
              </div>
              <p className="text-sm text-dark-500">{asset.assetNo} · {asset.categoryName}</p>
              <p className="text-sm text-dark-500 mt-1">存放位置: {asset.location}</p>
              <p className="text-sm text-dark-500">责任人: {asset.managerName}</p>
            </div>
          </div>
        )}

        {mode === 'multi' && (
          <div className="bg-dark-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-dark-800 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary-500" />
                选择要借用的资产
                <span className="text-xs font-normal text-dark-500">
                  （已选 {selectedAssetIds.length} / {availableAssets.length}）
                </span>
              </h4>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleSelectAll}
              >
                {selectedAssetIds.length === availableAssets.length ? '取消全选' : '全选'}
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {availableAssets.map((a) => {
                const conflict = getAssetConflictInfo(a.id);
                const isSelected = selectedAssetIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
                      isSelected && !conflict ? 'bg-primary-50 border-primary-300' : 
                      conflict ? 'bg-danger-50 border-danger-300' : 
                      'bg-white border-dark-200 hover:border-primary-300'
                    )}
                    onClick={() => handleToggleAsset(a.id)}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      isSelected && !conflict ? 'bg-primary-500 border-primary-500' :
                      conflict ? 'bg-danger-500 border-danger-500' :
                      'border-dark-300'
                    )}>
                      {isSelected && !conflict && <Check className="w-3 h-3 text-white" />}
                      {conflict && <X className="w-3 h-3 text-white" />}
                    </div>
                    <img
                      src={a.imageUrl}
                      alt={a.name}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-dark-800 truncate">{a.name}</p>
                        <StatusBadge type="asset" status={a.status} size="sm" />
                      </div>
                      <p className="text-xs text-dark-500 truncate">{a.categoryName} · {a.location}</p>
                    </div>
                    {conflict && (
                      <span className="text-xs text-danger-600 font-medium flex-shrink-0">
                        {conflict.conflicts.length}天冲突
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {multiConflicts.length > 0 && (
              <div className="mt-3 bg-danger-50 border border-danger-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-danger-800">
                      有 {multiConflicts.length} 项资产存在日期冲突，将无法提交
                    </p>
                    <div className="mt-1 space-y-0.5">
                      {multiConflicts.slice(0, 2).map((c, i) => (
                        <p key={i} className="text-xs text-danger-700">
                          • {c.assetName}: {c.conflicts.length}天冲突
                        </p>
                      ))}
                      {multiConflicts.length > 2 && (
                        <p className="text-xs text-danger-600">...还有 {multiConflicts.length - 2} 项</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentUser && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-50 rounded-lg p-3">
              <p className="text-xs text-dark-500 mb-1">申请人</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-dark-400" />
                <p className="font-medium text-dark-800">{currentUser.name}</p>
              </div>
            </div>
            <div className="bg-dark-50 rounded-lg p-3">
              <p className="text-xs text-dark-500 mb-1">所属部门</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-dark-400" />
                <p className="font-medium text-dark-800">{currentUser.departmentName}</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'single' && selectedAssetId && (
          <div className="bg-white border border-dark-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-dark-800 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary-500" />
                资产占用日历（未来30天）
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
                  {calendarMonth.getFullYear()}年 {monthNames[calendarMonth.getMonth()]}
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

            <div className="flex items-center gap-4 mb-3 text-xs">
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
                <span className="w-3 h-3 rounded bg-primary-200 border border-primary-400" />
                <span className="text-dark-600">您的选择</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-danger-100 border-2 border-danger-500" />
                <span className="text-dark-600">日期冲突</span>
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
              {getDaysInMonth(calendarMonth).map(({ date, isCurrentMonth }, index) => {
                const dayOccupancy = getOccupancyForDate(date);
                const inRange = isInSelectedRange(date);
                const hasConflict = isConflictDate(date);
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <div
                    key={index}
                    className={cn(
                      'min-h-[60px] p-1 bg-white relative',
                      !isCurrentMonth && 'bg-dark-50',
                      isPast && 'bg-dark-50',
                      inRange && !hasConflict && 'bg-primary-100',
                      hasConflict && 'bg-danger-100'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                        !isCurrentMonth && 'text-dark-300',
                        isToday(date) && 'bg-primary-500 text-white',
                        hasConflict && isCurrentMonth && !isToday(date) && 'bg-danger-500 text-white'
                      )}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {dayOccupancy.slice(0, 2).map((r, i) => (
                        <div
                          key={i}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded truncate text-white',
                            r.status === 'approved' && 'bg-primary-500',
                            r.status === 'pending' && 'bg-warning-500',
                            r.status === 'overdue' && 'bg-danger-500'
                          )}
                          title={`${r.userName} - ${r.purpose}`}
                        >
                          {r.userName}
                        </div>
                      ))}
                      {dayOccupancy.length > 2 && (
                        <div className="text-[10px] text-dark-500 text-center">
                          +{dayOccupancy.length - 2}
                        </div>
                      )}
                    </div>
                    {hasConflict && (
                      <div className="absolute top-0.5 right-0.5">
                        <AlertTriangle className="w-3 h-3 text-danger-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-danger-800">日期冲突，无法提交申请</p>
                <p className="text-sm text-danger-600 mt-1">
                  您选择的时间段内有 {conflicts.length} 天存在占用冲突：
                </p>
                <div className="mt-2 space-y-1">
                  {conflicts.slice(0, 3).map((conflict, index) => (
                    <div key={index} className="text-sm text-danger-700 bg-white/50 rounded px-2 py-1">
                      <span className="font-medium">{conflict.date}</span> - 被 {conflict.records.map(r => r.userName).join('、')} 占用
                      <span className="text-xs text-danger-500 ml-2">
                        ({conflict.records.map(r => r.status === 'approved' ? '借用中' : r.status === 'pending' ? '待审批' : '已逾期').join('、')})
                      </span>
                    </div>
                  ))}
                  {conflicts.length > 3 && (
                    <p className="text-xs text-danger-500">...还有 {conflicts.length - 3} 天冲突</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              借用日期
            </label>
            <input
              type="date"
              value={borrowDate}
              onChange={(e) => setBorrowDate(e.target.value)}
              min={formatDate(new Date())}
              className={cn(
                'w-full px-4 py-2.5 rounded-[6px] border border-dark-200 bg-white text-dark-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all'
              )}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              预计归还日期
            </label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              min={borrowDate}
              className={cn(
                'w-full px-4 py-2.5 rounded-[6px] border bg-white text-dark-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all',
                !isDateValid ? 'border-danger-500' : 'border-dark-200'
              )}
              required
            />
            {!isDateValid && (
              <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                归还日期必须晚于借用日期
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1.5">
            <Clock className="w-4 h-4 inline mr-1" />
            借用用途
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={4}
            placeholder="请详细说明借用用途..."
            className={cn(
              'w-full px-4 py-2.5 rounded-[6px] border border-dark-200 bg-white text-dark-800',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all',
              'resize-none'
            )}
            required
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            icon={<HandCoins className="w-4 h-4" />}
            disabled={!canSubmit}
          >
            {mode === 'single' 
              ? (conflicts.length > 0 ? `存在${conflicts.length}天冲突` : '提交申请')
              : (selectedAssetIds.length > 0 
                  ? `提交 ${selectedAssetIds.length - multiConflicts.length} 项申请`
                  : '请选择资产')
            }
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
