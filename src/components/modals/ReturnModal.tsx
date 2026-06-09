import * as React from 'react';
import { useUIStore, useBorrowStore, useAssetStore } from '@/store';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatCurrency, cn } from '@/utils';
import { DamageLevel } from '@/types';
import {
  QrCode,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  DollarSign,
  ScanLine,
} from 'lucide-react';

export const ReturnModal: React.FC = () => {
  const { showReturnModal, returnModalRecordId, closeReturnModal } = useUIStore();
  const { returnAsset, records, fetchRecords } = useBorrowStore();
  const { assets } = useAssetStore();
  const [scanning, setScanning] = React.useState(false);
  const [scanComplete, setScanComplete] = React.useState(false);
  const [damageLevel, setDamageLevel] = React.useState<DamageLevel>('none');
  const [repairCost, setRepairCost] = React.useState('');
  const [damageNote, setDamageNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const record = returnModalRecordId ? records.find(r => r.id === returnModalRecordId) : null;
  const asset = record ? assets.find(a => a.id === record.assetId) : null;

  React.useEffect(() => {
    if (showReturnModal && !scanComplete) {
      setScanning(true);
      const timer = setTimeout(() => {
        setScanning(false);
        setScanComplete(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showReturnModal, scanComplete]);

  const handleClose = () => {
    closeReturnModal();
    setDamageLevel('none');
    setRepairCost('');
    setDamageNote('');
    setScanComplete(false);
    setScanning(false);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalRecordId || !scanComplete) return;

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    returnAsset(returnModalRecordId, {
      damageLevel,
      repairCost: repairCost ? parseFloat(repairCost) : 0,
      damageNote: damageNote.trim(),
    });

    fetchRecords();
    setSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const damageOptions: { value: DamageLevel; label: string; color: string }[] = [
    { value: 'none', label: '完好无损', color: 'bg-success-500' },
    { value: 'minor', label: '轻微损坏', color: 'bg-warning-500' },
    { value: 'moderate', label: '中等损坏', color: 'bg-primary-500' },
    { value: 'severe', label: '严重损坏', color: 'bg-danger-500' },
  ];

  if (success) {
    return (
      <Modal open={showReturnModal} onClose={handleClose} hideCloseButton>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-success-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <h3 className="text-xl font-bold text-dark-800 mb-2 font-display">归还确认成功</h3>
          <p className="text-dark-500">资产已归还，状态已更新</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={showReturnModal}
      onClose={handleClose}
      title="资产归还确认"
      size="lg"
    >
      {!scanComplete ? (
        <div className="text-center py-8">
          <div className="relative w-48 h-48 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary-300 flex items-center justify-center">
              <QrCode className="w-24 h-24 text-primary-300" />
            </div>
            {scanning && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute inset-x-0 h-1 bg-primary-500 animate-pulse" style={{ top: '50%' }} />
              </div>
            )}
            <ScanLine className="absolute inset-0 w-full h-full text-primary-500 animate-pulse" />
          </div>
          <p className="text-dark-700 font-medium mb-2">
            {scanning ? '正在扫描资产二维码...' : '请扫描资产二维码'}
          </p>
          <p className="text-sm text-dark-500">将摄像头对准资产上的二维码进行识别</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {record && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                <PackageCheck className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="font-medium text-success-800">资产识别成功</p>
                <p className="text-sm text-success-600">{record.assetName} ({record.assetNo})</p>
              </div>
            </div>
          )}

          {record && asset && (
            <div className="bg-dark-50 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-dark-800">{asset.name}</h4>
                    <StatusBadge type="asset" status={asset.status} size="sm" />
                  </div>
                  <p className="text-sm text-dark-500">借用人: {record.userName} ({record.userDepartment})</p>
                  <p className="text-sm text-dark-500">
                    借用时间: {formatDate(record.borrowDate)} ~ {formatDate(record.expectedReturnDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-3">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              损坏程度评估
            </label>
            <div className="grid grid-cols-2 gap-3">
              {damageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDamageLevel(option.value)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left',
                    damageLevel === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-dark-200 hover:border-dark-300 bg-white'
                  )}
                >
                  <span className={cn('w-3 h-3 rounded-full', option.color)} />
                  <span className={cn(
                    'text-sm font-medium',
                    damageLevel === option.value ? 'text-primary-700' : 'text-dark-700'
                  )}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {damageLevel !== 'none' && (
            <>
              <Input
                label="维修费用 (元)"
                type="number"
                placeholder="请输入预估维修费用"
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
                icon={<DollarSign className="w-4 h-4" />}
                min="0"
                step="0.01"
              />
              <Textarea
                label="损坏情况说明"
                placeholder="请详细描述损坏情况..."
                value={damageNote}
                onChange={(e) => setDamageNote(e.target.value)}
                rows={3}
              />
            </>
          )}

          {damageLevel !== 'none' && repairCost && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-700">预估维修费用</span>
                <span className="text-xl font-bold text-danger-600">
                  {formatCurrency(parseFloat(repairCost))}
                </span>
              </div>
            </div>
          )}

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleClose}>
              取消
            </Button>
            <Button
              type="submit"
              variant={damageLevel !== 'none' ? 'danger' : 'success'}
              loading={submitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {damageLevel !== 'none' ? '确认损坏登记' : '确认归还'}
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
};
