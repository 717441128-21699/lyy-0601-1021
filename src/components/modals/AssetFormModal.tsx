import * as React from 'react';
import { useUIStore, useAssetStore, useUserStore } from '@/store';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/utils';
import { AssetStatus } from '@/types';
import {
  Plus,
  Edit,
  CheckCircle2,
  Upload,
  X,
} from 'lucide-react';

export const AssetFormModal: React.FC = () => {
  const { showAssetForm, editingAssetId, closeAssetForm } = useUIStore();
  const { addAsset, updateAsset, getAssetById, categories } = useAssetStore();
  const { users } = useUserStore();
  const [formData, setFormData] = React.useState({
    name: '',
    assetNo: '',
    categoryId: '',
    status: 'available' as AssetStatus,
    location: '',
    managerId: '',
    description: '',
    purchaseDate: '',
    purchasePrice: '',
  });
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const isEditing = !!editingAssetId;

  React.useEffect(() => {
    if (editingAssetId) {
      const asset = getAssetById(editingAssetId);
      if (asset) {
        setFormData({
          name: asset.name,
          assetNo: asset.assetNo,
          categoryId: asset.categoryId,
          status: asset.status,
          location: asset.location,
          managerId: asset.managerId,
          description: asset.description,
          purchaseDate: asset.purchaseDate,
          purchasePrice: asset.purchasePrice.toString(),
        });
        setUploadedFiles(asset.attachments);
      }
    } else {
      setFormData({
        name: '',
        assetNo: `AST-${Date.now().toString().slice(-6)}`,
        categoryId: '',
        status: 'available',
        location: '',
        managerId: '',
        description: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: '',
      });
      setUploadedFiles([]);
    }
  }, [editingAssetId, getAssetById, showAssetForm]);

  const handleClose = () => {
    closeAssetForm();
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.managerId) return;

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const categoryName = categories.find(c => c.id === formData.categoryId)?.name || '';
    const managerName = users.find(u => u.id === formData.managerId)?.name || '';

    const imagePrompt = encodeURIComponent(`professional product photo of ${formData.name}, office equipment, white background, studio lighting`);
    const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${imagePrompt}&image_size=square`;

    if (isEditing && editingAssetId) {
      updateAsset(editingAssetId, {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        categoryName,
        managerName,
        attachments: uploadedFiles,
        imageUrl,
      });
    } else {
      addAsset({
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        categoryName,
        managerName,
        attachments: uploadedFiles,
        imageUrl,
        categoryId: formData.categoryId,
        location: formData.location,
        managerId: formData.managerId,
      });
    }

    setSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleFileUpload = () => {
    const fileName = `附件${uploadedFiles.length + 1}.pdf`;
    setUploadedFiles([...uploadedFiles, fileName]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const managerOptions = users.map(u => ({ value: u.id, label: u.name }));
  const statusOptions: { value: AssetStatus; label: string }[] = [
    { value: 'available', label: '可用' },
    { value: 'borrowed', label: '借用中' },
    { value: 'maintenance', label: '维修中' },
    { value: 'scrapped', label: '已报废' },
    { value: 'lost', label: '已丢失' },
  ];

  if (success) {
    return (
      <Modal open={showAssetForm} onClose={handleClose} hideCloseButton>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-success-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <h3 className="text-xl font-bold text-dark-800 mb-2 font-display">
            {isEditing ? '资产更新成功' : '资产添加成功'}
          </h3>
          <p className="text-dark-500">资产信息已保存到台账</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={showAssetForm}
      onClose={handleClose}
      title={isEditing ? '编辑资产信息' : '添加新资产'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="资产名称"
            placeholder="请输入资产名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="资产编号"
            value={formData.assetNo}
            onChange={(e) => setFormData({ ...formData, assetNo: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="资产分类"
            options={categoryOptions}
            placeholder="请选择分类"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
          />
          <Select
            label="资产状态"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="存放位置"
            placeholder="例如：A栋3楼办公区"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          <Select
            label="责任人"
            options={managerOptions}
            placeholder="请选择责任人"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">
              购入日期
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className={cn(
                'w-full px-4 py-2.5 rounded-[6px] border border-dark-200 bg-white text-dark-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all'
              )}
              required
            />
          </div>
          <Input
            label="购入价格 (元)"
            type="number"
            placeholder="请输入购入价格"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            min="0"
            step="0.01"
            required
          />
        </div>

        <Textarea
          label="资产描述"
          placeholder="请输入资产描述信息..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-3">
            相关附件
          </label>
          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-dark-50 rounded-lg"
                >
                  <span className="text-sm text-dark-700">{file}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 rounded hover:bg-dark-200 text-dark-400 hover:text-dark-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleFileUpload}
            className="w-full p-4 border-2 border-dashed border-dark-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all flex flex-col items-center gap-2 text-dark-500 hover:text-primary-600"
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm">点击上传附件（采购单、保修卡等）</span>
          </button>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            icon={isEditing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            disabled={!formData.name || !formData.categoryId || !formData.managerId}
          >
            {isEditing ? '保存修改' : '添加资产'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
