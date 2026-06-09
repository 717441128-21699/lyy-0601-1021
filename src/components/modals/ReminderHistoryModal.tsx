import * as React from 'react';
import { useUIStore, useBorrowStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate, getStatusLabel } from '@/utils';
import { ReminderRecord, ReminderMethod } from '@/types';
import {
  Bell,
  X,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';

const methodLabels: Record<ReminderMethod, string> = {
  email: '邮件',
  sms: '短信',
  phone: '电话',
  wechat: '微信',
  other: '其他',
};

const methodColors: Record<ReminderMethod, string> = {
  email: 'bg-blue-100 text-blue-700',
  sms: 'bg-green-100 text-green-700',
  phone: 'bg-purple-100 text-purple-700',
  wechat: 'bg-success-100 text-success-700',
  other: 'bg-dark-100 text-dark-700',
};

export const ReminderHistoryModal: React.FC = () => {
  const { showReminderHistoryModal, reminderHistoryRecordId, closeReminderHistoryModal } = useUIStore();
  const { records, getRemindersForRecord } = useBorrowStore();

  const record = reminderHistoryRecordId ? records.find(r => r.id === reminderHistoryRecordId) : null;
  const reminders = reminderHistoryRecordId ? getRemindersForRecord(reminderHistoryRecordId) : [];

  if (!record) return null;

  return (
    <Modal
      open={showReminderHistoryModal}
      onClose={closeReminderHistoryModal}
      title="催还历史记录"
      size="lg"
    >
      <div className="space-y-5">
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

        {reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.map((reminder, index) => (
              <div
                key={reminder.id}
                className="relative pl-8 pb-6 last:pb-0"
              >
                {index < reminders.length - 1 && (
                  <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-dark-200" />
                )}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bell className="w-3 h-3 text-primary-600" />
                </div>
                <div className="bg-white border border-dark-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${methodColors[reminder.method]}`}>
                        {methodLabels[reminder.method]}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-dark-500">
                        <CheckCircle className="w-3 h-3 text-success-500" />
                        {getStatusLabel('reminder', reminder.status)}
                      </span>
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
