import React, { useState, useEffect, useRef } from 'react';
import type { CodeClassification } from '../types/domain';
import { Button, Input } from './ui';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

interface CodeClassificationCrudDrawerProps {
  mode: CrudMode;
  data?: CodeClassification; // 编辑/查看时传入的数据
  modelType: string; // 当前机型类型
  isLoading?: boolean;
  onClose: () => void;
  onSave?: (data: CodeClassification) => void;
  onDelete?: (code: string) => void;
}

const CodeClassificationCrudDrawer: React.FC<CodeClassificationCrudDrawerProps> = ({
  mode,
  data,
  modelType,
  isLoading = false,
  onClose,
  onSave,
  onDelete
}) => {
  // 解析代码编号和名称 (使用新的分离字段结构)
  const initialCodeNumber = data ? data.code : '';
  const initialCodeName = data ? data.name || '' : '';
  
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 表单数据状态
  const [formData, setFormData] = useState({
    codeNumber: initialCodeNumber,
    codeName: initialCodeName,
    modelClassificationId: data?.modelClassificationId || ''
  });

  // 自动聚焦到第一个输入框
  useEffect(() => {
    if (mode === 'create' || mode === 'update') {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100); // 添加一个小的延迟以确保抽屉动画完成后聚焦
    }
  }, [mode]);

  // 表单验证状态
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 确认删除状态
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.codeNumber || formData.codeNumber.trim() === '') {
      newErrors.codeNumber = '代码编号不能为空';
    } else if (!/^\d+$/.test(formData.codeNumber)) {
      newErrors.codeNumber = '代码编号必须为数字';
    }
    
    if (!formData.codeName || formData.codeName.trim() === '') {
      newErrors.codeName = '代码名称不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // 根据模式执行不同操作
    if (mode === 'create' || mode === 'update') {
      const codeClassification: Partial<CodeClassification> = {
        ...data, // 保留原有数据
        code: formData.codeNumber,
        name: formData.codeName,
        displayName: `${formData.codeNumber}-${formData.codeName}`,
        modelClassificationId: formData.modelClassificationId
      };
      
      if (onSave) {
        onSave(codeClassification as CodeClassification);
      }
    }
    
    onClose();
  };

  // 处理删除
  const handleDelete = () => {
    if (confirmDelete && data?.code && onDelete) {
      onDelete(data.code);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  // 取消删除确认
  const cancelDelete = () => {
    setConfirmDelete(false);
  };

  // 获取抽屉标题
  const getDrawerTitle = () => {
    switch (mode) {
      case 'create': return '新增代码分类';
      case 'read': return `代码分类详情: ${data?.code || ''}`;
      case 'update': return '编辑代码分类';
      case 'delete': return '删除代码分类';
      default: return '代码分类';
    }
  };

  // 是否为只读模式
  const isReadOnly = mode === 'read' || mode === 'delete';

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={isLoading ? undefined : onClose}
      ></div>

      {/* 抽屉 */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-50 flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-200 p-6 pb-4">
          <h2 className="text-xl font-bold">{getDrawerTitle()}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 text-xl disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <form onSubmit={handleSubmit} id="code-classification-form">
            {/* 机型类型 - 只读显示 */}
            <Input
              label="机型类型"
              value={modelType}
              disabled
              className="bg-gray-100"
            />

            {/* 代码编号 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">代码编号</label>
              <input
                ref={firstInputRef}
                type="text"
                name="codeNumber"
                value={formData.codeNumber}
                onChange={handleChange}
                disabled={isReadOnly || isLoading}
                placeholder="例如: 1, 2, 3"
                className={`w-full border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 text-sm ${errors.codeNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              />
              {errors.codeNumber && <p className="mt-1 text-sm text-red-600">{errors.codeNumber}</p>}
            </div>

            {/* 代码名称 */}
            <Input
              label="代码名称"
              name="codeName"
              value={formData.codeName}
              onChange={handleChange}
              disabled={isReadOnly || isLoading}
              placeholder="例如: 内层, 薄板, 载盘"
              error={errors.codeName}
            />

            </form>
          </div>
        </div>

        {/* 按钮区域 - 固定在抽屉底部 */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end space-x-3">
              {mode === 'delete' && !confirmDelete && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  variant="danger"
                  disabled={isLoading}
                >
                  删除
                </Button>
              )}

              {mode === 'delete' && confirmDelete && (
                <>
                  <Button
                    type="button"
                    onClick={cancelDelete}
                    variant="info"
                    disabled={isLoading}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDelete}
                    variant="danger"
                    disabled={isLoading}
                  >
                    {isLoading ? '删除中...' : '确认删除'}
                  </Button>
                </>
              )}

              {mode === 'read' && (
                <Button
                  type="button"
                  onClick={onClose}
                  variant="info"
                  disabled={isLoading}
                >
                  关闭
                </Button>
              )}

              {(mode === 'create' || mode === 'update') && (
                <>
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="info"
                    disabled={isLoading}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    form="code-classification-form"
                    variant="primary"
                    disabled={isLoading}
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </Button>
                </>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CodeClassificationCrudDrawer; 