import * as React from 'react';
import { useUIStore, useBorrowStore, useUserStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatDate, getStatusLabel, getReminderMethodLabel, getReminderMethodIcon, getReminderMethodColor, cn } from '@/utils';
import { ReminderRecord, ReminderMethod } from '@/types';
import {
  Bell,
  X,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  Filter,
} from 'lucide-react';

export const ReminderHistoryModal: React.FC = () => {
  const { showReminderHistoryModal, reminderHistoryRecordId, closeReminderHistoryModal } = useUIStore();
  const { records, getRemindersForRecord, getAllReminders } = useBorrowStore();
  const { users, currentUser } = useUserStore();
  const [filterMethod, setFilterMethod] = React.useState<ReminderMethod | 'all'>('all');
  const [filterRemindedBy, setFilterRemindedBy] = React.useState<string>('all');
  const [viewAll, setViewAll] = React.useState(false);

  const record = reminderHistoryRecordId ? records.find(r => r.id === reminderHistoryRecordId) : null;
  const recordReminders = reminderHistoryRecordId ? getRemindersForRecord(reminderHistoryRecordId) : [];
  const allReminders = getAllReminders();
  
  const displayReminders = React.useMemo(() => {
    let reminders = viewAll ? allReminders : recordReminders;
    
    if (filterMethod !== 'all') {
      reminders = reminders.filter(r => r.method === filterMethod);
    }
    
    if (filterRemindedBy !== 'all') {
      reminders = reminders.filter(r => r.remindedBy === filterRemindedBy);
    }
    
    return reminders.sort((a, b) => new Date(b.remindedAt).getTime() - new Date(a.remindedAt).getTime());
  }, [viewAll, allReminders, recordReminders, filterMethod, filterRemindedBy]);

  const methodOptions = [
    { value: 'all', label: '全部方式' },
    { value: 'email', label: `${getReminderMethodIcon('email')} 邮件` },
    { value: 'sms', label: `${getReminderMethodIcon('sms')} 短信` },
    { value: 'phone', label: `${getReminderMethodIcon('phone')} 电话` },
    { value: 'wechat', label: `${getReminderMethodIcon('wechat')} 微信` },
    { value: 'other', label: `${getReminderMethodIcon('other')} 其他` },
  ];

  const userOptions = [
    { value: 'all', label: '全部催还人' },
    ...users
      .filter(u => u.role === 'admin' || u.role === 'approver')
      .map(u => ({ value: u.id, label: u.name })),
  ];

  if (!record && !viewAll) return null;

  return (
    <Modal
      open={showReminderHistoryModal}
      onClose={closeReminderHistoryModal}
      title="催还历史记录"
      size="xl"
    >
      <div className="space-y-5">
        {!viewAll && record && (
          <div className="bg-dark-50 rounded-lg p-4">
            <h4 className="font-medium text-dark-800 mb-2">借用信息</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-dark-500">资产：</span>
                <span className="text-dark-800">{record.assetName}</span>
              </div>
              <div>
                <span className="text-dark-500">借用人：</span>
                <span className="text-dark-800">{record.userName}</span>
              </div>
              <div>
                <span className="text-dark-500">借用日期：</span>
                <span className="text-dark-800">{formatDate(record.borrowDate)}</span>
              </div>
              <div>
                <span className="text-dark-500">应归还日期：</span>
                <span className="text-danger-600 font-medium">{formatDate(record.expectedReturnDate)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-dark-50 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-500" />
              <span className="text-sm font-medium text-dark-700">筛选条件</span>
            </div>
            <div className="flex-1 flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-500">查看范围：</span>
                <button
                  onClick={() => setViewAll(!viewAll)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full transition-all',
                    viewAll ? 'bg-primary-500 text-white' : 'bg-white text-dark-600 border border-dark-200 hover:border-primary-300'
                  )}
                >
                  {viewAll ? '全部催还记录' : '仅当前记录'}
                </button>
              </div>
              <div className="w-40">
                <Select
                  value={filterMethod}
                  onChange={(v) => setFilterMethod(v as any)}
                  options={methodOptions}
                  size="sm"
                />
              </div>
              <div className="w-40">
                <Select
                  value={filterRemindedBy}
                  onChange={(v) => setFilterRemindedBy(v as string)}
                  options={userOptions}
                  size="sm"
                />
              </div>
            </div>
          </div>
          <div className="text-xs text-dark-500">
            共 {displayReminders.length} 条记录
            {filterMethod !== 'all' && ` · 方式：${getReminderMethodLabel(filterMethod)}`}
            {filterRemindedBy !== 'all' && ` · 催还人：${users.find(u => u.id === filterRemindedBy)?.name}`}
          </div>
        </div>

        {displayReminders.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {displayReminders.map((reminder, index) => (
              <div
                key={reminder.id}
                className="relative pl-8 pb-6 last:pb-0"
              >
                {index < displayReminders.length - 1 && (
                  <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-dark-200" />
                )}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bell className="w-3 h-3 text-primary-600" />
                </div>
                <div className="bg-white border border-dark-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getReminderMethodColor(reminder.method))}>
                        {getReminderMethodIcon(reminder.method)} {getReminderMethodLabel(reminder.method)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-dark-500">
                        <CheckCircle className="w-3 h-3 text-success-500" />
                        {getStatusLabel('reminder', reminder.status)}
                      </span>
                      {viewAll && (
                        <span className="text-xs text-dark-500 bg-dark-100 px-2 py-0.5 rounded">
                          {reminder.assetName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-dark-500">
                      {formatDate(new Date(reminder.remindedAt))}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1 text-dark-600">
                      <User className="w-3.5 h-3.5 text-dark-400" />
                      催还人：{reminder.remindedByName}
                    </div>
                    <div className="flex items-center gap-1 text-dark-600">
                      <Calendar className="w-3.5 h-3.5 text-dark-400" />
                      逾期 {reminder.daysOverdue} 天
                    </div>
                    <div className="flex items-center gap-1 text-dark-600">
                      <User className="w-3.5 h-3.5 text-dark-400" />
                      借用人：{reminder.userName}
                    </div>
                    <div className="flex items-center gap-1 text-dark-600">
                      <Calendar className="w-3.5 h-3.5 text-dark-400" />
                      应归还：{formatDate(reminder.expectedReturnDate)}
                    </div>
                  </div>
                  {reminder.note && (
                    <div className="bg-dark-50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-dark-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-dark-700">{reminder.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-500">暂无催还记录</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-dark-100">
          <Button
            variant="secondary"
            onClick={closeReminderHistoryModal}
          >
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
};
