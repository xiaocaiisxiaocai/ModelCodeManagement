import { useState, useEffect } from 'react';
import type { CodeUsageEntry, OccupancyTypeDict, ProductNameDict } from '../types/domain';
import { services } from '../services';

interface EditModalProps {
  entry: CodeUsageEntry;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ entry, onClose }) => {
  // 占用类型选项状态
  const [occupancyTypes, setOccupancyTypes] = useState<OccupancyTypeDict[]>([]);
  const [loadingOccupancyTypes, setLoadingOccupancyTypes] = useState(true);

  // 品名选项状态
  const [productNames, setProductNames] = useState<ProductNameDict[]>([]);
  const [loadingProductNames, setLoadingProductNames] = useState(true);

  const [formData, setFormData] = useState({
    model: entry.model,
    extension: entry.extension || '',
    productName: entry.productName,
    occupancyType: entry.occupancyType || '', // TODO: 实现新的dataDictionary服务
    description: entry.description,
    // remarks属性已移除
  });

  // 获取占用类型数据
  useEffect(() => {
    const loadOccupancyTypes = async () => {
      try {
        setLoadingOccupancyTypes(true);
        // TODO: 实现新的dataDictionary服务
        const response = { success: true, data: [] };
        if (response.success && response.data) {
          setOccupancyTypes(response.data);
        } else {
          console.error('获取占用类型失败: 服务未实现');
          setOccupancyTypes([]);
        }
      } catch (error) {
        console.error('获取占用类型异常:', error);
        setOccupancyTypes([]);
      } finally {
        setLoadingOccupancyTypes(false);
      }
    };

    loadOccupancyTypes();
  }, []);

  // 获取品名数据
  useEffect(() => {
    const loadProductNames = async () => {
      try {
        setLoadingProductNames(true);
        // TODO: 实现新的dataDictionary服务
        const response = { success: true, data: [], error: undefined };
        if (response.success && response.data) {
          setProductNames(response.data);
        } else {
          console.error('获取品名失败:', response.error || '服务未实现');
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
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 将中文占用类型转换为后端需要的英文代码
    const submitData = {
      ...formData,
      occupancyType: formData.occupancyType ? 
        formData.occupancyType : // TODO: 实现新的dataDictionary映射 
        formData.occupancyType
    };
    
    // 实际应用中，这里会调用ModelService进行更新
    onClose();
  };

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
      
      {/* 模态框 */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-bold">编辑机型编码</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">机型</label>
              <select 
                name="model"
                value={formData.model}
                onChange={handleChange}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              >
                <option value={entry.model}>{entry.model}</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">延伸</label>
              <input 
                type="text"
                name="extension"
                value={formData.extension}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
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
                  name="productName"
                  value={formData.productName || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择品名</option>
                  {productNames.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
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
                  name="occupancyType"
                  value={formData.occupancyType || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">说明</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              ></textarea>
            </div>
            
            {/* 备注字段已移除，因为新的CodeUsageEntry类型不包含remarks属性 */}
            
            <div className="flex justify-end border-t border-gray-200 pt-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
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
    </>
  );
};

export default EditModal; 