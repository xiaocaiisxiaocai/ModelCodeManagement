// MigratedProductTypePage.tsx - 迁移后的产品类型页面示例
// 这个文件展示了如何将现有组件迁移到统一数据服务架构

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernLayout from '../components/ModernLayout';
import ProductTypeCrudDrawer from '../components/ProductTypeCrudDrawer';
import { Button, Card, CardBody, Badge } from '../components/ui';
import type { ProductType, DataResponse } from '../mock/interfaces';

// ✅ 使用统一服务 - 新方式
import { unifiedServices } from '../services/unifiedService';

// ❌ 旧方式 - 已弃用
// import { ModelService } from '../services/modelService';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

/**
 * 统一错误处理Hook
 */
const useServiceResponse = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResponse = async <T,>(
    serviceCall: () => Promise<DataResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await serviceCall();
      
      if (response.success && response.data) {
        onSuccess?.(response.data);
        
        // 可选：显示成功消息
        if (response.message) {
          // TODO: 集成toast通知系统
        }
        
        return response.data;
      } else {
        const errorMsg = response.error || '操作失败';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('❌', errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = '网络连接错误';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('❌', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleResponse };
};

const MigratedProductTypePage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, error, handleResponse } = useServiceResponse();
  
  // 状态管理
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [drawerMode, setDrawerMode] = useState<CrudMode | null>(null);
  
  // 组件挂载时加载数据
  useEffect(() => {
    loadProductTypes();
  }, []);
  
  /**
   * 加载产品类型数据 - 新方式
   */
  const loadProductTypes = async () => {
    await handleResponse(
      () => unifiedServices.productType.getAllProductTypes(),
      (data) => {
        setProductTypes(data);
      },
      (errorMsg) => {
        console.error('加载产品类型失败:', errorMsg);
        // 可选：显示用户友好的错误消息
      }
    );
  };

  // ❌ 旧方式 - 已弃用
  // const loadProductTypes = () => {
  //   const types = ModelService.ProductType.getAllProductTypes();
  //   setProductTypes(types);
  // };
  
  /**
   * 处理选择产品类型 - 导航到下一级页面
   */
  const handleSelectProductType = (productType: string) => {
    navigate(`/model-classification/${productType}`);
  };
  
  /**
   * 处理创建新产品类型
   */
  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setDrawerMode('create');
  };
  
  /**
   * 处理编辑产品类型
   */
  const handleEditProduct = (product: ProductType, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setSelectedProduct(product);
    setDrawerMode('update');
  };
  
  /**
   * 处理删除产品类型
   */
  const handleDeleteProduct = (product: ProductType, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setSelectedProduct(product);
    setDrawerMode('delete');
  };
  
  /**
   * 关闭抽屉
   */
  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedProduct(null);
  };
  
  /**
   * 保存产品类型数据 - 新方式
   */
  const handleSaveProduct = async (product: Omit<ProductType, 'id'>) => {
    let success = false;
    
    if (drawerMode === 'create') {
      const result = await handleResponse(
        () => unifiedServices.productType.addProductType(product),
        (data) => {
          success = true;
        },
        (errorMsg) => {
          console.error('创建产品类型失败:', errorMsg);
        }
      );
      success = result !== null;
    } else if (drawerMode === 'update' && selectedProduct?.id) {
      const result = await handleResponse(
        () => unifiedServices.productType.updateProductType(selectedProduct.id, product),
        (data) => {
          success = true;
        },
        (errorMsg) => {
          console.error('更新产品类型失败:', errorMsg);
        }
      );
      success = result !== null;
    }
    
    if (success) {
      handleCloseDrawer();
      await loadProductTypes(); // 重新加载数据
    }
  };

  // ❌ 旧方式 - 已弃用
  // const handleSaveProduct = (product: ProductType) => {
  //   if (drawerMode === 'create') {
  //     ModelService.ProductType.addProductType(product);
  //   } else if (drawerMode === 'update' && product.id) {
  //     ModelService.ProductType.updateProductType(product.id, product);
  //   }
  //   
  //   loadProductTypes();
  //   handleCloseDrawer();
  // };
  
  /**
   * 删除产品类型 - 新方式
   */
  const handleDeleteProductConfirm = async (id: string) => {
    const result = await handleResponse(
      () => unifiedServices.productType.deleteProductType(id),
      () => {
      },
      (errorMsg) => {
        console.error('删除产品类型失败:', errorMsg);
      }
    );
    
    if (result !== null) {
      handleCloseDrawer();
      await loadProductTypes(); // 重新加载数据
    }
  };

  // ❌ 旧方式 - 已弃用
  // const handleDeleteProductConfirm = (id: string) => {
  //   ModelService.ProductType.deleteProductType(id);
  //   loadProductTypes();
  //   handleCloseDrawer();
  // };

  return (
    <ModernLayout title="编码管理" subtitle="选择产品类型以继续">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="i-carbon-warning text-red-400"></span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 工具栏 */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={handleCreateProduct}
          icon={<span className="i-carbon-add"></span>}
          variant="primary"
          disabled={loading}
        >
          {loading ? '加载中...' : '新增产品类型'}
        </Button>
      </div>
      
      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      )}
      
      {/* 产品类型列表 */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productTypes.length > 0 ? (
            productTypes.map((product) => (
              <Card
                key={product.id}
                hover
                clickable
                onClick={() => handleSelectProductType(product.code)}
                className="overflow-hidden"
              >
                {/* 产品类型头部 */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-32 p-6 flex flex-col justify-center items-center">
                  <Badge variant="secondary" size="lg" className="bg-white/20 text-white border-white/30">
                    {product.code}
                  </Badge>
                </div>
                
                {/* 产品类型操作区 */}
                <CardBody className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      onClick={(e) => handleEditProduct(product, e)}
                      variant="warning"
                      size="sm"
                      disabled={loading}
                    >
                      编辑
                    </Button>
                    <Button
                      onClick={(e) => handleDeleteProduct(product, e)}
                      variant="danger"
                      size="sm"
                      disabled={loading}
                    >
                      删除
                    </Button>
                  </div>
                  <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                    进入 <span className="i-carbon-arrow-right ml-1"></span>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <div className="text-gray-500 text-lg">暂无产品类型</div>
              <p className="text-gray-400 mt-2">请点击"新增产品类型"开始添加</p>
            </div>
          )}
        </div>
      )}
      
      {/* 产品类型CRUD抽屉 */}
      {drawerMode && (
        <ProductTypeCrudDrawer
          mode={drawerMode}
          data={selectedProduct || undefined}
          onClose={handleCloseDrawer}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProductConfirm}
        />
      )}
      
      {/* 开发者调试信息 - 生产环境应移除 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 rounded-md border text-xs text-gray-600">
          <div className="font-medium mb-2">🛠 开发者信息:</div>
          <div>加载状态: {loading ? '加载中' : '已完成'}</div>
          <div>产品类型数量: {productTypes.length}</div>
          <div>错误状态: {error || '无'}</div>
          <div>当前操作: {drawerMode || '无'}</div>
        </div>
      )}
    </ModernLayout>
  );
};

export default MigratedProductTypePage;

/**
 * 🚀 迁移要点总结:
 * 
 * 1. ✅ 统一服务使用: 
 *    - 从 ModelService 迁移到 unifiedServices.productType
 *    - 所有操作都返回统一的 DataResponse 格式
 * 
 * 2. ✅ 错误处理增强:
 *    - 添加了 useServiceResponse Hook 处理统一错误
 *    - 显示加载状态和错误提示
 *    - 控制台日志记录操作结果
 * 
 * 3. ✅ 异步操作:
 *    - 所有数据操作改为 async/await 模式
 *    - 正确处理异步操作的加载状态
 * 
 * 4. ✅ 类型安全:
 *    - 使用完整的 TypeScript 类型定义
 *    - DataResponse<T> 提供类型安全的响应处理
 * 
 * 5. ✅ 用户体验:
 *    - 加载状态指示器
 *    - 错误消息显示
 *    - 按钮禁用状态管理
 * 
 * 6. ✅ 开发体验:
 *    - 详细的控制台日志
 *    - 开发环境调试信息
 *    - 清晰的代码注释和文档
 */