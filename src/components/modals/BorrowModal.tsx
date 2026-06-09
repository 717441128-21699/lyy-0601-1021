import * as React from 'react';
import { useUIStore, useAssetStore, useBorrowStore, useUserStore } from '@/store';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, cn } from '@/utils';
import { CalendarIcon, HandCoins, AlertCircle, CheckCircle2 } from 'lucide-react';

export const BorrowModal: React.FC = () => {
  const { showBorrowModal, borrowModalAssetId, closeBorrowModal } = useUIStore();
  const { getAssetById, assets } = useAssetStore();
  const { createBorrowRequest, fetchRecords } = useBorrowStore();
  const { currentUser } = useUserStore();
  const [selectedAssetId, setSelectedAssetId] = React.useState(borrowModalAssetId || '');
  const [borrowDate, setBorrowDate] = React.useState(formatDate(new Date()));
  const [expectedReturnDate, setExpectedReturnDate] = React.useState(formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [purpose, setPurpose] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const asset = selectedAssetId ? getAssetById(selectedAssetId) : null;
  const availableAssets = assets.filter(a => a.status === 'available');

  React.useEffect(() => {
    if (borrowModalAssetId) {
      setSelectedAssetId(borrowModalAssetId);
    }
  }, [borrowModalAssetId]);

  const handleClose = () => {
    closeBorrowModal();
    setPurpose('');
    setBorrowDate(formatDate(new Date()));
    setExpectedReturnDate(formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !purpose.trim()) return;

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    createBorrowRequest({
      assetId: selectedAssetId,
      borrowDate,
      expectedReturnDate,
      purpose: purpose.trim(),
    });
    
    fetchRecords();
    setSubmitting(false);
    setSuccess(true);
    
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const isDateValid = new Date(expectedReturnDate) > new Date(borrowDate);

  const availableOptions = availableAssets.map(a => ({
    value: a.id,
    label: `${a.name} (${a.assetNo})`,
  }));

  if (success) {
    return (
      <Modal open={showBorrowModal} onClose={handleClose} hideCloseButton>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-success-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <h3 className="text-xl font-bold text-dark-800 mb-2 font-display">申请提交成功</h3>
          <p className="text-dark-500">您的借用申请已提交，等待审批人审批</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={showBorrowModal}
      onClose={handleClose}
      title="申请借用资产"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {!borrowModalAssetId && (
          <Select
            label="选择资产"
            options={availableOptions}
            placeholder="请选择要借用的资产"
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            required
          />
        )}

        {asset && (
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

        {currentUser && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-50 rounded-lg p-3">
              <p className="text-xs text-dark-500 mb-1">申请人</p>
              <p className="font-medium text-dark-800">{currentUser.name}</p>
            </div>
            <div className="bg-dark-50 rounded-lg p-3">
              <p className="text-xs text-dark-500 mb-1">所属部门</p>
              <p className="font-medium text-dark-800">{currentUser.departmentName}</p>
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

        <Textarea
          label="借用用途"
          placeholder="请详细说明借用用途..."
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={4}
          required
        />

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            icon={<HandCoins className="w-4 h-4" />}
            disabled={!selectedAssetId || !purpose.trim() || !isDateValid}
          >
            提交申请
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
