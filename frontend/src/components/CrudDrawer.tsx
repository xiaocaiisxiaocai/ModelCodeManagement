import React, { useState, useEffect } from 'react';
import type { CodeUsageEntry, OccupancyTypeDict, ProductNameDict, Customer } from '../mock/interfaces';
import { unifiedServices } from '../services/unifiedService';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

interface CrudDrawerProps {
  mode: CrudMode;
  data?: CodeUsageEntry; // 编辑/查看时传入的数据
  modelType?: string; // 创建时需要的机型类型
  codeNumber?: string; // 创建时需要的代码编号
  isLoading?: boolean;
  onClose: () => void;
  onSave?: (data: CodeUsageEntry) => void;
  onDelete?: (id: string) => void;
}

const CrudDrawer: React.FC<CrudDrawerProps> = ({
  mode,
  data,
  modelType,
  codeNumber,
  isLoading = false,
  onClose,
  onSave,
  onDelete
}) => {
  // 解析机型前缀和后缀
  const parseModelParts = (model: string) => {
    // 例如: 'SLU-101' => { prefix: 'SLU-1', suffix: '01' }
    const match = model?.match(/^(.+?)(\d{2})$/);
    if (match) {
      return { prefix: match[1], suffix: match[2] };
    }
    return { prefix: model, suffix: '' };
  };

  // 检测是否为直接访问模式（2层结构）
  const isDirectAccess = !codeNumber;
  
  // 获取机型前缀（固定部分）
  const getModelPrefix = () => {
    if (data?.model) {
      if (isDirectAccess) {
        // 2层结构编辑时：从完整机型中提取前缀（如 "AC-50" -> "AC"）
        const parts = data.model.split('-');
        return parts[0] || '';
      } else {
        // 3层结构编辑时：使用原有的解析逻辑
        return parseModelParts(data.model).prefix;
      }
    }
    // 3层结构：使用机型类型+代码编号
    if (modelType && codeNumber) {
      return `${modelType}${codeNumber}`;
    }
    // 2层结构：使用机型类型（去掉末尾的-）
    return modelType ? modelType.replace(/-$/, '') : '';
  };

  // 获取机型后缀（可编辑部分）
  const getModelSuffix = () => {
    if (data?.model) {
      return parseModelParts(data.model).suffix;
    }
    return '';
  };

  // 占用类型选项状态
  const [occupancyTypes, setOccupancyTypes] = useState<OccupancyTypeDict[]>([]);
  const [loadingOccupancyTypes, setLoadingOccupancyTypes] = useState(true);

  // 品名选项状态
  const [productNames, setProductNames] = useState<ProductNameDict[]>([]);
  const [loadingProductNames, setLoadingProductNames] = useState(true);

  // 客户和厂区选项状态
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // 表单数据状态
  const [formData, setFormData] = useState<Partial<CodeUsageEntry> & { modelSuffix: string }>({
    // 不再直接存储完整的model，而是拆分为前缀和后缀
    modelSuffix: getModelSuffix(),
    extension: data?.extension || '',
    // 在直接访问模式下，代码编号应该可编辑；在标准模式下使用传入的codeNumber
    codeNumber: data?.codeNumber || (isDirectAccess ? '' : codeNumber || ''),
    productName: data?.productName || '',
    description: data?.description || '',
    occupancyType: data?.occupancyType || '',
    customer: data?.customer || '',
    factory: data?.factory || '',
    builder: data?.builder || '当前用户', // 实际应用中应从认证上下文获取
    requester: data?.requester || '',
    remarks: data?.remarks || '',
    isDeleted: false
  });

  // 机型前缀（固定部分）
  const [modelPrefix] = useState(getModelPrefix());

  // 表单验证状态
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 级联选择状态
  const [availableFactories, setAvailableFactories] = useState<string[]>([]);
  
  // 确认删除状态
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 监听客户变化，更新可选厂区
  // 获取占用类型数据
  useEffect(() => {
    const loadOccupancyTypes = async () => {
      try {
        setLoadingOccupancyTypes(true);
        const response = await unifiedServices.dataDictionary.getOccupancyTypes();
        if (response.success && response.data) {
          setOccupancyTypes(response.data);
          // 如果表单数据中没有occupancyType，设置默认值为第一个选项
          if (!formData.occupancyType && response.data.length > 0) {
            setFormData(prev => ({ 
              ...prev, 
              occupancyType: response.data[0].name 
            }));
          } else if (formData.occupancyType && data?.occupancyType) {
            // 如果是编辑模式，将后端返回的英文代码转换为中文名称
            const mappedName = unifiedServices.dataDictionary.mapOccupancyTypeCodeToName(data.occupancyType);
            setFormData(prev => ({ 
              ...prev, 
              occupancyType: mappedName 
            }));
          }
        } else {
          console.error('获取占用类型失败:', response.error);
          // 失败时不设置默认值，让用户知道出错了
          setOccupancyTypes([]);
        }
      } catch (error) {
        console.error('获取占用类型异常:', error);
        // 异常时不设置默认值，让用户知道出错了
        setOccupancyTypes([]);
      } finally {
        setLoadingOccupancyTypes(false);
      }
    };

    loadOccupancyTypes();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 获取品名数据
  useEffect(() => {
    const loadProductNames = async () => {
      try {
        setLoadingProductNames(true);
        const response = await unifiedServices.dataDictionary.getProductNames();
        if (response.success && response.data) {
          setProductNames(response.data);
        } else {
          console.error('获取品名失败:', response.error);
          setProductNames([]);
        }
      } catch (error) {
        console.error('获取品名异常:', error);
        setProductNames([]);
      } finally {
        setLoadingProductNames(false);
      }
    };

    loadProductNames();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 获取客户数据
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const response = await unifiedServices.dataDictionary.getCustomers();
        if (response.success && response.data) {
          setCustomers(response.data);
        } else {
          console.error('获取客户列表失败:', response.error);
          setCustomers([]);
        }
      } catch (error) {
        console.error('获取客户列表异常:', error);
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  useEffect(() => {
    const loadFactoriesByCustomer = async () => {
      if (formData.customer) {
        const customer = customers.find(c => c.name === formData.customer);
        if (customer) {
          try {
            const response = await unifiedServices.dataDictionary.getFactoriesByCustomer(customer.id);
            if (response.success && response.data) {
              const factoryNames = response.data.map(f => f.name);
              setAvailableFactories(factoryNames);
              
              // 如果当前厂区不在可选列表中，清空厂区
              if (formData.factory && !factoryNames.includes(formData.factory)) {
                setFormData(prev => ({ ...prev, factory: '' }));
              }
            } else {
              console.error('获取厂区列表失败:', response.error);
              setAvailableFactories([]);
            }
          } catch (error) {
            console.error('获取厂区列表异常:', error);
            setAvailableFactories([]);
          }
        }
      } else {
        setAvailableFactories([]);
        setFormData(prev => ({ ...prev, factory: '' }));
      }
    };

    // 只有当客户数据加载完成后才执行
    if (!loadingCustomers) {
      loadFactoriesByCustomer();
    }
  }, [formData.customer, customers, loadingCustomers]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 对机型后缀进行特殊处理，限制为两位数字
    if (name === 'modelSuffix') {
      const numericValue = value.replace(/\D/g, ''); // 只保留数字
      const limitedValue = numericValue.slice(0, 2); // 限制为两位
      
      setFormData(prev => ({ ...prev, [name]: limitedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
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
    
    if (!modelPrefix) {
      newErrors.modelPrefix = '机型前缀不能为空';
    }
    
    // 3层结构需要验证机型后缀，2层结构不需要
    if (!isDirectAccess && (!formData.modelSuffix || formData.modelSuffix.length !== 2)) {
      newErrors.modelSuffix = '机型后缀必须为两位数字(00-99)';
    }
    
    // 在直接访问模式下验证代码编号
    if (isDirectAccess) {
      if (!formData.codeNumber || formData.codeNumber.trim() === '') {
        newErrors.codeNumber = '代码编号不能为空';
      }
    }
    
    if (!formData.productName || formData.productName.trim() === '') {
      newErrors.productName = '品名不能为空';
    }
    
    if (!formData.requester || formData.requester.trim() === '') {
      newErrors.requester = '需求人不能为空';
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
      // 在实际应用中，这里应该调用API或服务
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
      
      // 组合完整的机型
      const fullModel = isDirectAccess 
        ? `${modelPrefix}-${formData.codeNumber}` // 2层结构：AC + - + 代码编号 (如: AC-50)
        : `${modelPrefix}${formData.modelSuffix}`; // 3层结构：SLU-1 + 后缀 (如: SLU-101)
      
      const saveData = {
        ...formData,
        model: fullModel, // 使用组合后的完整机型
        id: data?.id || Math.random().toString(36).substring(2, 9),
        creationDate: data?.creationDate || formattedDate,
        // 将中文占用类型转换为后端需要的英文代码
        occupancyType: formData.occupancyType ? 
          unifiedServices.dataDictionary.mapOccupancyTypeNameToCode(formData.occupancyType) : 
          formData.occupancyType
      } as CodeUsageEntry;
      
      // 删除临时使用的modelSuffix字段
      delete (saveData as Record<string, unknown>).modelSuffix;
      
      if (onSave) {
        onSave(saveData);
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
      case 'create': return '新增机型编码';
      case 'read': return `${data?.model || ''} 详细信息`;
      case 'update': return '编辑机型编码';
      case 'delete': return '删除机型编码';
      default: return '机型编码';
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
            <form onSubmit={handleSubmit} id="crud-form">
            {/* 机型字段 - 3层和2层结构都显示，但内容不同 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">机型</label>
              {!isDirectAccess ? (
                // 3层结构：机型前缀 + 后缀（可编辑）
                <div className="flex items-center space-x-2">
                  {/* 机型前缀（不可编辑） */}
                  <input
                    type="text"
                    value={modelPrefix}
                    disabled
                    className="w-2/3 px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                  {/* 机型后缀（可编辑） */}
                  <input
                    type="text"
                    name="modelSuffix"
                    value={formData.modelSuffix}
                    onChange={handleChange}
                    placeholder="00-99"
                    maxLength={2}
                    disabled={isReadOnly || isLoading}
                    className={`w-1/3 px-3 py-2 border ${errors.modelSuffix ? 'border-red-500' : 'border-gray-300'} rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                  />
                </div>
              ) : (
                // 2层结构：只显示机型前缀
                <input
                  type="text"
                  value={modelPrefix}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              )}
              {errors.modelPrefix && <p className="text-red-500 text-xs mt-1">{errors.modelPrefix}</p>}
              {errors.modelSuffix && <p className="text-red-500 text-xs mt-1">{errors.modelSuffix}</p>}
            </div>

            {/* 代码 - 在直接访问模式下显示并可编辑 */}
            {isDirectAccess && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">代码</label>
                <input
                  type="text"
                  name="codeNumber"
                  value={formData.codeNumber}
                  onChange={handleChange}
                  disabled={isReadOnly || isLoading}
                  placeholder="例如: 50, 100"
                  className={`w-full px-3 py-2 border ${errors.codeNumber ? 'border-red-500' : 'border-gray-300'} rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                />
                {errors.codeNumber && <p className="text-red-500 text-xs mt-1">{errors.codeNumber}</p>}
              </div>
            )}

            {/* 延伸 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">延伸</label>
              <input
                type="text"
                name="extension"
                value={formData.extension}
                onChange={handleChange}
                disabled={isReadOnly || isLoading}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
              />
            </div>

            {/* 品名 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">品名</label>
              {loadingProductNames ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                  加载品名选项...
                </div>
              ) : productNames.length === 0 ? (
                <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-500">
                  无法加载品名选项，请刷新页面重试
                </div>
              ) : (
                <select
                  value={formData.productName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border ${errors.productName ? 'border-red-500' : 'border-gray-300'} rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                >
                  <option value="">请选择品名</option>
                  {productNames.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName}</p>}
            </div>

            {/* 占用类型 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">占用类型</label>
              {loadingOccupancyTypes ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                  加载占用类型...
                </div>
              ) : occupancyTypes.length === 0 ? (
                <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-500">
                  无法加载占用类型，请刷新页面重试
                </div>
              ) : (
                <select
                  value={formData.occupancyType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupancyType: e.target.value }))}
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                >
                  <option value="">请选择占用类型</option>
                  {occupancyTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 客户 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">客户</label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                disabled={isReadOnly || isLoading}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
              >
                <option value="">请选择客户</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.name}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 厂区 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">厂区</label>
              <select
                name="factory"
                value={formData.factory}
                onChange={handleChange}
                disabled={isReadOnly || !formData.customer || isLoading}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${(isReadOnly || !formData.customer || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
              >
                <option value="">
                  {formData.customer ? '请选择厂区' : '请先选择客户'}
                </option>
                {availableFactories.map((factory, index) => (
                  <option key={index} value={factory}>
                    {factory}
                  </option>
                ))}
              </select>
            </div>

            {/* 说明 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">说明</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isReadOnly || isLoading}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                rows={3}
              ></textarea>
            </div>

            {/* 需求人 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">需求人</label>
              <input
                type="text"
                name="requester"
                value={formData.requester}
                onChange={handleChange}
                disabled={isReadOnly || isLoading}
                className={`w-full px-3 py-2 border ${errors.requester ? 'border-red-500' : 'border-gray-300'} rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
              />
              {errors.requester && <p className="text-red-500 text-xs mt-1">{errors.requester}</p>}
            </div>

            {/* 备注 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">备注</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                disabled={isReadOnly || isLoading}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${(isReadOnly || isLoading) ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                rows={2}
              ></textarea>
            </div>

            {/* 创建日期 - 仅在查看和编辑模式下显示 */}
            {(mode === 'read' || mode === 'update') && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">创建日期</label>
                <input
                  type="text"
                  value={data?.creationDate || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            )}

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
                    form="crud-form"
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

export default CrudDrawer; 