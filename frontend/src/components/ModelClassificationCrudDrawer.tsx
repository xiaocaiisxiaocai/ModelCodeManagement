import React, { useState, useEffect, useRef } from 'react';
import type { ModelClassification } from '../types/domain';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

interface ModelClassificationCrudDrawerProps {
  mode: CrudMode;
  data?: ModelClassification; // 编辑/查看时传入的数据
  productType: string; // 当前产品类型
  isLoading?: boolean;
  onClose: () => void;
  onSave?: (data: ModelClassification) => void;
  onDelete?: (type: string) => void;
}

const ModelClassificationCrudDrawer: React.FC<ModelClassificationCrudDrawerProps> = ({
  mode,
  data,
  productType,
  isLoading = false,
  onClose,
  onSave,
  onDelete
}) => {
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 表单数据状态 - 使用表单专用类型
  const [formData, setFormData] = useState({
    type: data?.type || '',
    description: data?.description || [''],
    productTypeId: data?.productTypeId || '',
    hasCodeClassification: data?.hasCodeClassification ?? true // 默认为true（需要代码分类）
  });

  // 自动聚焦到第一个输入框
  useEffect(() => {
    // 仅在创建模式下自动聚焦，因为编辑模式下该输入框是禁用的
    if (mode === 'create') {
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

  // 处理复选框变化
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // 处理描述变化
  const handleDescriptionChange = (index: number, value: string) => {
    const newDescription = [...(formData.description || [''])];
    newDescription[index] = value;
    setFormData(prev => ({ ...prev, description: newDescription }));
  };

  // 添加新的描述行
  const addDescriptionLine = () => {
    setFormData(prev => ({
      ...prev,
      description: [...(prev.description || []), '']
    }));
  };

  // 删除描述行
  const removeDescriptionLine = (index: number) => {
    const newDescription = [...(formData.description || [''])];
    newDescription.splice(index, 1);
    if (newDescription.length === 0) {
      newDescription.push(''); // 至少保留一行
    }
    setFormData(prev => ({ ...prev, description: newDescription }));
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 验证机型类型：只允许大写字母
    if (!formData.type || formData.type.trim() === '') {
      newErrors.type = '机型类型不能为空';
    } else if (formData.type.length < 2 || formData.type.length > 20) {
      newErrors.type = '机型类型长度必须在2-20个字符之间';
    } else if (!/^[A-Z]+$/.test(formData.type)) {
      newErrors.type = '机型类型只能包含大写字母，如：SLU、SLUR等';
    }
    
    // 验证描述：允许为空，但如果有内容，每项不能超过500字符，也不能有空字符串
    if (formData.description && formData.description.length > 0) {
      if (formData.description.some(desc => desc.trim() === '')) {
        newErrors.description = '描述项不能为空字符串';
      } else if (formData.description.some(desc => desc.length > 500)) {
        newErrors.description = '每个描述项长度不能超过500个字符';
      }
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
      if (onSave) {
        // 修复：在提交前过滤掉空的描述行
        const cleanedFormData = {
          ...formData,
          description: formData.description?.filter(desc => desc.trim() !== '') || []
        };
        onSave(cleanedFormData as ModelClassification);
      }
    }
    
    onClose();
  };

  // 处理删除
  const handleDelete = () => {
    if (confirmDelete && data?.type && onDelete) {
      onDelete(data.type);
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
      case 'create': return '新增机型分类';
      case 'read': return `机型分类详情: ${data?.type || ''}`;
      case 'update': return '编辑机型分类';
      case 'delete': return '删除机型分类';
      default: return '机型分类';
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
            <form onSubmit={handleSubmit} id="model-classification-form">
            {/* 机型类型 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">机型类型</label>
              <input
                ref={firstInputRef}
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={isReadOnly || isLoading}
                placeholder="例如: SLU, SLUR"
                className={`w-full px-3 py-2 border ${errors.type ? 'border-red-500' : 'border-gray-300'} rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
              />
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              {!errors.type && <p className="text-gray-500 text-xs mt-1">机型类型只能包含大写字母</p>}
            </div>


            {/* 产品类型 - 只读显示 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">关联产品类型</label>
              <input
                type="text"
                value={productType}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>

            {/* 描述 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                描述
                {errors.description && (
                  <span className="text-red-500 text-xs ml-2">{errors.description}</span>
                )}
              </label>

              {formData.description?.map((desc, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={desc}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    disabled={isReadOnly || isLoading}
                    placeholder={`描述行 ${index + 1}`}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                  />
                  {!isReadOnly && formData.description && formData.description.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDescriptionLine(index)}
                      disabled={isLoading}
                      className="ml-2 px-2 py-2 bg-red-50 text-red-500 rounded-md hover:bg-red-100 disabled:opacity-50"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={addDescriptionLine}
                  disabled={isLoading}
                  className="mt-2 px-3 py-1 bg-blue-50 text-blue-500 rounded-md hover:bg-blue-100 text-sm disabled:opacity-50"
                >
                  + 添加描述行
                </button>
              )}
            </div>

            {/* 代码分类设置 */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-3">导航结构设置</label>
              <div className="bg-gray-50 p-4 rounded-md">
                <label className={`flex items-start space-x-3 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    name="hasCodeClassification"
                    checked={formData.hasCodeClassification}
                    onChange={handleCheckboxChange}
                    disabled={isReadOnly || isLoading}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">需要代码分类层</span>
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="mb-1">
                        <strong>勾选（3层结构）：</strong>产品类型 → 机型分类 → 代码分类 → 代码使用
                      </div>
                      <div>
                        <strong>不勾选（2层结构）：</strong>产品类型 → 机型分类 → 代码使用
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            </form>
          </div>
        </div>

        {/* 按钮区域 - 固定在抽屉底部 */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end space-x-3">
              {mode === 'delete' && !confirmDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-200 text-red-800 rounded-md hover:bg-red-300 disabled:opacity-50"
                >
                  删除
                </button>
              )}

              {mode === 'delete' && confirmDelete && (
                <>
                  <button
                    type="button"
                    onClick={cancelDelete}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-200 text-red-800 rounded-md hover:bg-red-300 disabled:opacity-50"
                  >
                    {isLoading ? '删除中...' : '确认删除'}
                  </button>
                </>
              )}

              {mode === 'read' && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                >
                  关闭
                </button>
              )}

              {(mode === 'create' || mode === 'update') && (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    form="model-classification-form"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-300 text-white rounded-md hover:bg-blue-400 disabled:opacity-50"
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </button>
                </>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModelClassificationCrudDrawer; 