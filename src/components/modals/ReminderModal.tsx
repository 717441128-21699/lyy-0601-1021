import * as React from 'react';
import { useUIStore, useBorrowStore, useUserStore } from '@/store';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate, getReminderMethodLabel, getReminderMethodIcon, getReminderMethodColor, cn } from '@/utils';
import { ReminderMethod } from '@/types';
import {
  Bell,
  Send,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

const methodOptions: { value: ReminderMethod; label: string }[] = [
  { value: 'email', label: `${getReminderMethodIcon('email')} 邮件` },
  { value: 'sms', label: `${getReminderMethodIcon('sms')} 短信` },
  { value: 'phone', label: `${getReminderMethodIcon('phone')} 电话` },
  { value: 'wechat', label: `${getReminderMethodIcon('wechat')} 微信` },
  { value: 'other', label: `${getReminderMethodIcon('other')} 其他` },
];

export const ReminderModal: React.FC = () => {
  const { showReminderModal, reminderModalRecordId, closeReminderModal } = useUIStore();
  const { records, createReminder, getRemindersForRecord } = useBorrowStore();
  const { currentUser } = useUserStore();
  const [method, setMethod] = React.useState<ReminderMethod>('email');
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const record = reminderModalRecordId ? records.find(r => r.id === reminderModalRecordId) : null;
  const existingReminders = reminderModalRecordId ? getRemindersForRecord(reminderModalRecordId) : [];

  React.useEffect(() => {
    if (showReminderModal) {
      setNote('');
      setSuccess(false);
    }
  }, [showReminderModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderModalRecordId || !currentUser) return;

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const reminder = createReminder({
      borrowRecordId: reminderModalRecordId,
      method,
      note: note.trim(),
    });

    setSubmitting(false);

    if (reminder) {
      setSuccess(true);
      setTimeout(() => {
        closeReminderModal();
        setSuccess(false);
      }, 1500);
    }
  };

  if (!record) return null;

  const today = new Date();
  const expected = new Date(record.expectedReturnDate);
  const daysOverdue = Math.ceil((today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));

  if (success) {
    return (
      <Modal open={showReminderModal} onClose={closeReminderModal} hideCloseButton>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-success-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <h3 className="text-xl font-bold text-dark-800 mb-2 font-display">催还通知已发送</h3>
          <p className="text-dark-500">
            已通过 <span className={getReminderMethodColor(method)}> {getReminderMethodLabel(method)} </span> 
            向 {record.userName} 发送催还通知
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={showReminderModal}
      onClose={closeReminderModal}
      title="发送催还通知"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-danger-800">资产已逾期 {daysOverdue} 天</p>
              <p className="text-sm text-danger-600 mt-1">
                {record.assetName} 应于 {formatDate(record.expectedReturnDate)} 归还
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-50 rounded-lg p-3">
            <p className="text-xs text-dark-500 mb-1">借用人</p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-dark-400" />
              <p className="font-medium text-dark-800">{record.userName}</p>
            </div>
            <p className="text-xs text-dark-500 mt-1">{record.userDepartment}</p>
          </div>
          <div className="bg-dark-50 rounded-lg p-3">
            <p className="text-xs text-dark-500 mb-1">资产信息</p>
            <p className="font-medium text-dark-800">{record.assetName}</p>
            <p className="text-xs text-dark-500 mt-1">{record.assetNo}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-2">
            催还方式
          </label>
          <Select
            value={method}
            onChange={(v) => setMethod(v as unknown as ReminderMethod)}
            options={methodOptions}
            placeholder="选择催还方式"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-2">
            催还备注
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="请输入催还备注信息..."
            rows={4}
          />
        </div>

        {existingReminders.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-dark-700 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-500" />
              历史催还记录 ({existingReminders.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {existingReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="bg-dark-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-dark-700">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getReminderMethodColor(reminder.method))}>
                        {getReminderMethodIcon(reminder.method)} {getReminderMethodLabel(reminder.method)}
                      </span>
                      <span className="ml-2">{reminder.remindedByName}</span>
                    </span>
                    <span className="text-xs text-dark-500">
                      {formatDate(new Date(reminder.remindedAt))}
                    </span>
                  </div>
                  {reminder.note && (
                    <p className="text-xs text-dark-600">{reminder.note}</p>
                  )}
                </div>
              ))}
              {existingReminders.length > 3 && (
                <p className="text-xs text-dark-500 text-center">
                  还有 {existingReminders.length - 3} 条催还记录
                </p>
              )}
            </div>
          </div>
        )}

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={closeReminderModal}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Send className="w-4 h-4" />}
            loading={submitting}
            disabled={!note.trim()}
          >
            发送催还
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
