import React, { useState, useEffect, useRef } from 'react';
import type { ProductType } from '../types/domain';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

interface ProductTypeCrudDrawerProps {
  mode: CrudMode;
  data?: ProductType; // 编辑/查看时传入的数据
  isLoading?: boolean; // 用于禁用表单
  onClose: () => void;
  onSave?: (data: ProductType) => void;
  onDelete?: (id: string) => void;
}

const ProductTypeCrudDrawer: React.FC<ProductTypeCrudDrawerProps> = ({
  mode,
  data,
  isLoading = false,
  onClose,
  onSave,
  onDelete
}) => {
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 表单数据状态
  const [formData, setFormData] = useState<Partial<ProductType>>({
    id: data?.id || '',
    code: data?.code || ''
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
    // 产品代码自动转换为大写
    const processedValue = name === 'code' ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
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
    
    if (!formData.code || formData.code.trim() === '') {
      newErrors.code = '产品代码不能为空';
    } else {
      const code = formData.code.trim();
      
      // 检查长度
      if (code.length < 2 || code.length > 20) {
        newErrors.code = '产品代码长度必须在2-20位之间';
      }
      // 检查格式：只能包含大写字母和数字
      else if (!/^[A-Z0-9]+$/.test(code)) {
        newErrors.code = '产品代码只能包含大写字母和数字';
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
        onSave(formData as ProductType);
      }
    }
    
    onClose();
  };

  // 处理删除
  const handleDelete = () => {
    if (confirmDelete && data?.id && onDelete) {
      onDelete(data.id);
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
      case 'create': return '新增产品类型';
      case 'read': return `产品类型详情: ${data?.code || ''}`;
      case 'update': return '编辑产品类型';
      case 'delete': return '删除产品类型';
      default: return '产品类型';
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
            <form onSubmit={handleSubmit} id="product-type-form">
            {/* 产品代码 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">产品代码</label>
              <input
                ref={firstInputRef}
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                disabled={isReadOnly || isLoading}
                placeholder="2-20位大写字母或数字，如: PCB, FPC, HDI"
                className={`w-full px-3 py-2 border ${errors.code ? 'border-red-500' : 'border-gray-300'} rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
              />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
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
                    form="product-type-form"
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

export default ProductTypeCrudDrawer; 