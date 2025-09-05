import React, { useState, useEffect } from 'react';
import { services } from '../services';

type DictEntryType = 'customer' | 'factory' | 'productName' | 'occupancyType' | 'modelType';
type CrudMode = 'create' | 'edit';

// 简化的表单数据类型
type DictFormData = any;
type FormDataType = any;

interface DataDictionaryModalProps {
  mode: CrudMode;
  entryType: DictEntryType;
  data?: DictFormData;
  onClose: () => void;
  onSave: () => void;
  customers?: any[]; // 用于厂区创建/编辑时的客户选择
}

const DataDictionaryModal: React.FC<DataDictionaryModalProps> = ({ 
  mode, 
  entryType, 
  data, 
  onClose, 
  onSave,
  customers = []
}) => {
  // 表单数据状态
  const [formData, setFormData] = useState<FormDataType>({} as FormDataType);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 初始化表单数据
  useEffect(() => {
    if (mode === 'edit' && data) {
      const editData = {
        id: data.Id || data.id,
        name: data.Name || data.name,
        code: data.Code || data.code,
        // 保留其他字段
        ...data
      };
      
      // 特殊处理厂区编辑：将 parentId 映射为 customerId
      if (entryType === 'factory' && (data.ParentId || data.parentId || data.CustomerId || data.customerId)) {
        editData.customerId = (data.ParentId || data.parentId || data.CustomerId || data.customerId)?.toString() || '';
      }
      
      setFormData(editData);
    } else {
      // 创建模式的默认值
      switch (entryType) {
        case 'customer':
          setFormData({ name: '', code: '' });
          break;
        case 'factory':
          setFormData({ name: '', code: '', customerId: '' });
          break;
        case 'productName':
          setFormData({ name: '', code: '' });
          break;
        case 'occupancyType':
          setFormData({ name: '', code: '' });
          break;
        case 'modelType':
          setFormData({ type: '', name: '', code: '', productType: '', description: [] });
          break;
      }
    }
  }, [mode, entryType, data]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormDataType) => ({ ...prev, [name]: value } as FormDataType));
    
    // 清除错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 处理机型分类描述变化（多选）
  const handleDescriptionChange = (value: string) => {
    const descriptions = value.split('、').filter(desc => desc.trim());
    setFormData((prev: FormDataType) => ({ ...prev, description: descriptions } as FormDataType));
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (entryType) {
      case 'customer':
        if (!formData.name?.trim()) {
          newErrors.name = '客户名称不能为空';
        }
        // 注意：名称唯一性检查暂时移除，后端会处理
        break;
        
      case 'factory':
        if (!formData.name?.trim()) {
          newErrors.name = '厂区名称不能为空';
        }
        if (!formData.customerId) {
          newErrors.customerId = '请选择所属客户';
        }
        // 注意：名称唯一性检查暂时移除，后端会处理
        break;
        
      case 'productName':
        if (!formData.name?.trim()) {
          newErrors.name = '品名不能为空';
        }
        // 注意：名称唯一性检查暂时移除，后端会处理
        break;
        
      case 'occupancyType':
        if (!formData.name?.trim()) {
          newErrors.name = '占用类型名称不能为空';
        }
        // 注意：名称唯一性检查暂时移除，后端会处理
        break;
        
      case 'modelType':
        if (!formData.type?.trim()) {
          newErrors.type = '机型代码不能为空';
        }
        if (!formData.name?.trim()) {
          newErrors.name = '机型名称不能为空';
        }
        if (!formData.productType?.trim()) {
          newErrors.productType = '产品类型不能为空';
        }
        // 注意：代码唯一性检查暂时移除，后端会处理
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      let result;
      
      if (mode === 'create') {
        // 创建新记录
        const createData = {
          category: getCategoryByType(entryType),
          code: formData.code || generateCode(entryType),
          name: formData.name,
          // 如果是厂区，设置ParentId为客户ID
          ...(entryType === 'factory' && formData.customerId && { parentId: parseInt(formData.customerId) })
        };
        
        result = await services.dataDictionary.create(createData);
      } else {
        // 更新记录
        const id = (data?.Id || data?.id)?.toString();
        if (!id) {
          throw new Error('缺少记录ID');
        }
        
        const updateData = {
          code: formData.code || data?.Code || data?.code || (data?.Id || data?.id)?.toString() || '',
          name: formData.name,
          // 如果是厂区编辑，包含 parentId
          parentId: entryType === 'factory' && formData.customerId ? formData.customerId : undefined
        };
        
        result = await services.dataDictionary.update(id, updateData);
      }
      
      if (result.success) {
        onSave();
        onClose();
      } else {
        console.error('操作失败:', result.error);
        alert(`操作失败: ${result.error}`);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert(`保存失败: ${error}`);
    }
  };
  
  // 根据类型获取分类名
  const getCategoryByType = (type: DictEntryType): string => {
    switch (type) {
      case 'customer': return 'Customer';
      case 'factory': return 'Factory';
      case 'productName': return 'ProductName';
      case 'occupancyType': return 'OccupancyType';
      case 'modelType': return 'ModelType';
      default: return 'Unknown';
    }
  };
  
  // 生成代码（基于名称和类型）
  const generateCode = (type: DictEntryType): string => {
    const name = formData.name || '';
    const timestamp = Date.now().toString().slice(-6); // 取后6位时间戳
    
    switch (type) {
      case 'customer': 
        // 尝试使用名称的拼音首字母，如果是中文的话
        return name.length > 0 ? name.substring(0, Math.min(name.length, 10)).toUpperCase() : `CUST_${timestamp}`;
      case 'factory': 
        return name.length > 0 ? name.substring(0, Math.min(name.length, 10)).toUpperCase() : `FACT_${timestamp}`;
      case 'productName': 
        return name.length > 0 ? name.substring(0, Math.min(name.length, 10)).toUpperCase() : `PROD_${timestamp}`;
      case 'occupancyType': 
        return name.length > 0 ? name.substring(0, Math.min(name.length, 10)).toUpperCase() : `OCC_${timestamp}`;
      case 'modelType': 
        return formData.type || name.substring(0, Math.min(name.length, 10)).toUpperCase() || `MODEL_${timestamp}`;
      default: 
        return `${name.substring(0, 5).toUpperCase()}_${timestamp}`;
    }
  };

  // 获取模态框标题
  const getModalTitle = () => {
    const action = mode === 'create' ? '新增' : '编辑';
    const typeMap = {
      customer: '客户',
      factory: '厂区',
      productName: '品名',
      occupancyType: '占用类型',
      modelType: '机型分类'
    };
    return `${action}${typeMap[entryType]}`;
  };

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>
      
      {/* 模态框 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-xl font-bold">{getModalTitle()}</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* 客户表单 */}
              {entryType === 'customer' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">客户名称 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="请输入客户名称"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                </>
              )}
              
              {/* 厂区表单 */}
              {entryType === 'factory' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">所属客户 *</label>
                    <select
                      name="customerId"
                      value={formData.customerId || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.customerId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">请选择客户</option>
                      {customers.map((customer) => (
                        <option key={customer.Id || customer.id} value={customer.Id || customer.id}>
                          {customer.Name || customer.name}
                        </option>
                      ))}
                    </select>
                    {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">厂区名称 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="请输入厂区名称"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                </>
              )}
              
              {/* 品名表单 */}
              {entryType === 'productName' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">品名 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="请输入品名"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                </>
              )}
              
              {/* 占用类型表单 */}
              {entryType === 'occupancyType' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">类型名称 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="请输入类型名称"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                </>
              )}
              
              {/* 机型分类表单 */}
              {entryType === 'modelType' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">机型代码 *</label>
                    <input
                      type="text"
                      name="type"
                      value={formData.type || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.type ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="例如: SLU-"
                    />
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">机型名称 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="请输入机型名称"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">产品类型 *</label>
                    <select
                      name="productType"
                      value={formData.productType || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.productType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">请选择产品类型</option>
                      <option value="PCB">PCB</option>
                      <option value="FPC">FPC</option>
                    </select>
                    {errors.productType && <p className="text-red-500 text-xs mt-1">{errors.productType}</p>}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">描述</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.description) ? formData.description.join('、') : ''}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="多个描述用、分隔"
                    />
                  </div>
                </>
              )}
              
              {/* 按钮区域 */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataDictionaryModal;