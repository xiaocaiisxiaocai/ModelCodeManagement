import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernLayout from '../components/ModernLayout';
import ProductTypeCrudDrawer from '../components/ProductTypeCrudDrawer';
import { Button, Card, CardBody, Badge, EmptyState, PageHeader } from '../components/ui';

// 使用新的类型系统
import type { DomainProductType as ProductType } from '../types';

// 定义表单数据类型
interface ProductTypeFormData {
  code: string;
  name?: string;
}
import { services } from '../services';
import { useServiceResponse } from '../hooks/useServiceResponse';
import { useApi } from '../hooks/useApi';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

const ProductTypePage: React.FC = () => {
  const navigate = useNavigate();
  // useServiceResponse 用于处理非GET请求的副作用（如创建、更新、删除）
  const { loading: mutationLoading, handleResponse, showSuccess, showError } = useServiceResponse();

  // 使用新的服务层获取数据
  const getProductTypes = useCallback(() => services.productType.getAll(), []);
  const { data: productTypes, loading: dataLoading, error: dataError, refetch: loadProductTypes } = useApi<ProductType[]>(getProductTypes);

  // 状态管理
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [drawerMode, setDrawerMode] = useState<CrudMode | null>(null);

  // 处理选择产品类型 - 直接进入下一级页面
  const handleSelectProductType = (productType: string) => {
    navigate(`/coding/model-classification/${productType}`);
  };

  // 处理创建新产品类型
  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setDrawerMode('create');
  };

  // 处理编辑产品类型
  const handleEditProduct = (product: ProductType, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发进入详情页
    setSelectedProduct(product);
    setDrawerMode('update');
  };

  // 处理删除产品类型
  const handleDeleteProduct = (product: ProductType, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发进入详情页
    setSelectedProduct(product);
    setDrawerMode('delete');
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedProduct(null);
  };

  /**
   * 保存产品类型数据 - 升级到新服务层
   */
  const handleSaveProduct = async (formData: ProductTypeFormData) => {
    let success = false;

    if (drawerMode === 'create') {
      const result = await handleResponse(
        () => services.productType.create(formData),
        (data) => {
          showSuccess(`成功创建产品类型: ${(data as ProductType).code}`);
          success = true;
        },
        (errorMsg) => {
          showError(`创建产品类型失败: ${errorMsg}`);
        }
      );
      success = result !== null;
    } else if (drawerMode === 'update' && selectedProduct?.id) {
      const result = await handleResponse(
        () => services.productType.update(selectedProduct.id, formData),
        (data) => {
          showSuccess(`成功更新产品类型: ${(data as ProductType).code}`);
          success = true;
        },
        (errorMsg) => {
          showError(`更新产品类型失败: ${errorMsg}`);
        }
      );
      success = result !== null;
    }

    if (success) {
      handleCloseDrawer();
      await loadProductTypes(); // 重新加载数据
    }
  };


  /**
   * 删除产品类型 - 升级到新服务层
   */
  const handleDeleteProductConfirm = async (id: string) => {
    const result = await handleResponse(
      () => services.productType.delete(id),
      () => {
        showSuccess('成功删除产品类型');
      },
      (errorMsg) => {
        showError(`删除产品类型失败: ${errorMsg}`);
      }
    );

    if (result !== null) {
      handleCloseDrawer();
      await loadProductTypes(); // 重新加载数据
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {productTypes && productTypes.length > 0 ? (
        productTypes.map((product) => (
          <Card
            key={product.id}
            hover
            clickable
            onClick={() => handleSelectProductType(product.code)}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-24 lg:h-32 p-4 lg:p-6 flex flex-col justify-center items-center">
              <Badge variant="secondary" size="lg" className="bg-white/20 text-white border-white/30 text-sm lg:text-base">
                {product.code}
              </Badge>
            </div>
            <CardBody className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-0">
              <div className="flex space-x-2 justify-center lg:justify-start">
                <Button
                  onClick={(e) => handleEditProduct(product, e)}
                  variant="warning"
                  size="sm"
                  disabled={mutationLoading}
                >
                  编辑
                </Button>
                <Button
                  onClick={(e) => handleDeleteProduct(product, e)}
                  variant="danger"
                  size="sm"
                  disabled={mutationLoading}
                >
                  删除
                </Button>
              </div>
              <div className="flex items-center text-blue-600 group-hover:text-blue-700 justify-center lg:justify-end text-sm lg:text-base">
                进入 <span className="i-carbon-arrow-right ml-1"></span>
              </div>
            </CardBody>
          </Card>
        ))
      ) : (
        <div className="col-span-full">
          <EmptyState
            icon={<span className="i-carbon-cube"></span>}
            title="暂无产品类型"
            message="开始添加您的第一个产品类型，以对其进行编码管理。"
            action={{
              text: '新增产品类型',
              onClick: handleCreateProduct,
              disabled: mutationLoading
            }}
          />
        </div>
      )}
    </div>
  );


  const renderContent = () => {
    if (dataLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="bg-gray-300 h-24 lg:h-32"></div>
              <CardBody className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-0">
                <div className="flex space-x-2 justify-center lg:justify-start">
                  <div className="bg-gray-300 h-6 lg:h-8 w-12 lg:w-16 rounded"></div>
                  <div className="bg-gray-300 h-6 lg:h-8 w-12 lg:w-16 rounded"></div>
                </div>
                <div className="bg-gray-300 h-6 w-20 rounded"></div>
              </CardBody>
            </Card>
          ))}
        </div>
      );
    }

    if (dataError) {
      return (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="i-carbon-warning text-red-500 mr-3"></span>
            <p className="text-sm text-red-800">{dataError}</p>
            <Button onClick={loadProductTypes} variant="danger" size="sm" className="ml-auto">重试</Button>
          </div>
        </div>
      );
    }

    return renderGridView();
  };

  return (
    <ModernLayout title="产品类型管理">
      <PageHeader
        title="产品类型管理"
        subtitle="选择一个产品类型以继续，或创建一个新的产品类型。"
        breadcrumbs={[{ label: '首页' }]}
        action={
          <Button
              onClick={handleCreateProduct}
              icon={<span className="i-carbon-add"></span>}
              variant="primary"
              size="sm"
              disabled={dataLoading || mutationLoading}
              className="whitespace-nowrap"
            >
              <span className="hidden sm:inline">{dataLoading ? '加载中...' : '新增产品类型'}</span>
              <span className="sm:hidden">{dataLoading ? '加载中...' : '新增'}</span>
            </Button>
        }
      />

      {renderContent()}

      {/* 产品类型CRUD抽屉 */}
      {drawerMode && (
        <ProductTypeCrudDrawer
          mode={drawerMode}
          data={selectedProduct || undefined}
          isLoading={mutationLoading}
          onClose={handleCloseDrawer}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProductConfirm}
        />
      )}

    </ModernLayout>
  );
};

export default ProductTypePage;