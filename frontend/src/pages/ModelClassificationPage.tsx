import { useParams, useNavigate } from 'react-router-dom';
import ModernLayout from '../components/ModernLayout';
import { useState, useCallback } from 'react';
import type { DomainModelClassification as ModelClassification } from '../types';

// 定义表单数据类型
interface ModelClassificationFormData {
  type: string;
  name?: string;
  description?: string[];
  productType: string;
  hasCodeClassification?: boolean;
}
import ModelClassificationCrudDrawer from '../components/ModelClassificationCrudDrawer';
import { Button, Card, CardBody, Badge, EmptyState, PageHeader } from '../components/ui';

import { services } from '../services';
import { useServiceResponse } from '../hooks/useServiceResponse';
import { useApi } from '../hooks/useApi';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

const ModelClassificationPage: React.FC = () => {
  const { productType } = useParams<{ productType: string }>();
  const navigate = useNavigate();
  const { loading: mutationLoading, handleResponse, showSuccess, showError } = useServiceResponse();

  // 使用 useApi Hook 获取数据
  const getModelClassifications = useCallback(() => {
    if (!productType) {
      return Promise.resolve({ success: true, data: [] }); // 返回一个空的成功响应
    }
    return services.modelClassification.getByProductType(productType);
  }, [productType]);

  const { data: filteredModels, loading: dataLoading, error: dataError, refetch: loadModelClassifications } = useApi(
    getModelClassifications,
    [productType] // 当 productType 变化时，useApi 会自动重新获取数据
  );

  // 获取产品类型列表，用于获取产品类型ID
  const getProductTypes = useCallback(() => services.productType.getAll(), []);
  const { data: productTypes } = useApi(getProductTypes);

  // 状态管理
  const [selectedModel, setSelectedModel] = useState<ModelClassification | null>(null);
  const [drawerMode, setDrawerMode] = useState<CrudMode | null>(null);

  
  // 处理进入机型分类 - 支持灵活导航
  const handleEnterModel = (model: ModelClassification) => {
    if (productType) {
      // 根据机型配置决定导航路径
      if (model.hasCodeClassification === false) {
        // 2层结构：直接跳转到代码使用页面
        navigate(`/coding/direct-code-usage/${productType}/${model.type}`);
      } else {
        // 3层结构（默认）：跳转到代码分类页面
        navigate(`/coding/code-classification/${productType}/${model.type}`);
      }
    }
  };
  
  // 处理创建新机型分类
  const handleCreateModel = () => {
    setSelectedModel(null);
    setDrawerMode('create');
  };
  
  // 处理编辑机型分类
  const handleEditModel = (model: ModelClassification, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发查看详情
    setSelectedModel(model);
    setDrawerMode('update');
  };
  
  // 处理删除机型分类
  const handleDeleteModel = (model: ModelClassification, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发查看详情
    setSelectedModel(model);
    setDrawerMode('delete');
  };
  
  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedModel(null);
  };
  
  /**
   * 保存机型分类数据 - 新方式
   */
  const handleSaveModel = async (model: ModelClassification) => {
    let success = false;
    
    if (drawerMode === 'create') {
      // 获取产品类型ID
      const currentProductType = productTypes?.find(pt => pt.code === productType);
      if (!currentProductType) {
        showError('创建机型分类失败: 无法找到产品类型');
        return;
      }

      // 构造创建数据，确保包含正确的产品类型ID
      const createData = {
        ...model,
        productTypeId: parseInt(currentProductType.id)
      };

      const result = await handleResponse(
        () => services.modelClassification.create(createData),
        (data) => {
          const modelClassification = data as ModelClassification;
          showSuccess(`成功创建机型分类: ${modelClassification.type}`);
          success = true;
        },
        (errorMsg) => {
          showError(`创建机型分类失败: ${errorMsg}`);
        }
      );
      success = result !== null;
    } else if (drawerMode === 'update' && selectedModel) {
      // 获取正确的ID用于更新 - 优先使用隐藏的后端ID
      const backendId = (selectedModel as any)._backendId;
      const modelId = backendId?.toString() || selectedModel.id || '';
      if (!modelId) {
        showError('更新机型分类失败: 缺少有效ID');
        return;
      }
      
      const result = await handleResponse(
        () => services.modelClassification.update(modelId, model),
        (data) => {
          const modelClassification = data as ModelClassification;
          showSuccess(`成功更新机型分类: ${modelClassification.type}`);
          success = true;
        },
        (errorMsg) => {
          showError(`更新机型分类失败: ${errorMsg}`);
        }
      );
      success = result !== null;
    }
    
    if (success) {
      handleCloseDrawer();
      await loadModelClassifications(); // 重新加载数据
    }
  };

  
  /**
   * 删除机型分类 - 新方式
   */
  const handleDeleteModelConfirm = async (idOrType: string) => {
    // 如果selectedModel存在，优先使用其ID
    let deleteId = idOrType;
    if (selectedModel) {
      deleteId = selectedModel.id?.toString() || idOrType;
    }
    
    const result = await handleResponse(
      () => services.modelClassification.delete(deleteId),
      () => {
        showSuccess(`成功删除机型分类: ${selectedModel?.type || idOrType}`);
      },
      (errorMsg) => {
        showError(`删除机型分类失败: ${errorMsg}`);
      }
    );
    
    if (result !== null) {
      handleCloseDrawer();
      await loadModelClassifications(); // 重新加载数据
    }
  };

  
  return (
    <ModernLayout title={`机型分类 - ${productType}`}>
      <PageHeader
        title="机型分类管理"
        subtitle={`管理 ${productType} 产品下的所有机型分类`}
        breadcrumbs={[
          { label: '首页', to: '/' },
          { label: productType! }
        ]}
        action={
          <Button
            onClick={handleCreateModel}
            icon={<span className="i-carbon-add"></span>}
            variant="primary"
            disabled={dataLoading || mutationLoading}
          >
            {dataLoading ? '加载中...' : '新增机型分类'}
          </Button>
        }
      />

      {/* 数据加载状态处理 */}
      {dataLoading && (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex">
                <div className="w-1/4 bg-gray-300 p-4"></div>
                <CardBody className="w-3/4 flex flex-col justify-between">
                  <div className="space-y-2 mb-3">
                    <div className="bg-gray-300 h-4 w-5/6 rounded"></div>
                    <div className="bg-gray-300 h-4 w-4/6 rounded"></div>
                  </div>
                  <div className="flex justify-end items-center space-x-3">
                    <div className="bg-gray-300 h-8 w-16 rounded"></div>
                    <div className="bg-gray-300 h-8 w-16 rounded"></div>
                  </div>
                </CardBody>
              </div>
            </Card>
          ))}
        </div>
      )}

      {dataError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="i-carbon-warning text-red-500 mr-3"></span>
            <p className="text-sm text-red-800">{dataError}</p>
            <Button onClick={loadModelClassifications} variant="danger" size="sm" className="ml-auto">重试</Button>
          </div>
        </div>
      )}

      {/* 机型分类列表 */}
      {!dataLoading && !dataError && (
        <>
          {filteredModels && Array.isArray(filteredModels) && filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {(filteredModels as ModelClassification[]).map((model) => (
                <Card
                  key={model.type}
                  hover
                  clickable
                  onClick={() => handleEnterModel(model)}
                  className="overflow-hidden"
                >
                  <div className="flex">
                    {/* 左侧：机型代码 - 根据层级结构使用不同颜色 */}
                    <div className={`w-1/4 text-white p-4 flex items-center justify-center ${
                      model.hasCodeClassification === false
                        ? 'bg-gradient-to-r from-green-600 to-green-500' // 2层结构：绿色
                        : 'bg-gradient-to-r from-blue-600 to-blue-500'   // 3层结构：蓝色（默认）
                    }`}>
                      <Badge variant="secondary" size="md" className="bg-white/20 text-white border-white/30">
                        {model.type}
                      </Badge>
                    </div>

                    {/* 右侧：机型说明和操作 */}
                    <CardBody className="w-3/4 flex flex-col justify-between">
                      {/* 描述列表 */}
                      <div className="mb-3">
                        {model.description.map((desc: string, idx: number) => (
                          <div key={idx} className="py-1 text-sm text-gray-700">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium mr-2 ${
                              model.hasCodeClassification === false
                                ? 'bg-green-100 text-green-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {idx + 1}
                            </span>
                            {desc}
                          </div>
                        ))}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex justify-end items-center space-x-3">
                        <Button
                          onClick={(e) => handleEditModel(model, e)}
                          variant="warning"
                          size="sm"
                          disabled={mutationLoading}
                        >
                          编辑
                        </Button>
                        <Button
                          onClick={(e) => handleDeleteModel(model, e)}
                          variant="danger"
                          size="sm"
                          disabled={mutationLoading}
                        >
                          删除
                        </Button>
                        <div className="flex items-center text-blue-600 ml-2">
                          进入 <span className="i-carbon-arrow-right ml-1"></span>
                        </div>
                      </div>
                    </CardBody>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<span className="i-carbon-assembly-cluster"></span>}
              title="暂无机型分类"
              message="为此产品类型添加第一个机型分类，以便进行更详细的编码管理。"
              action={{
                text: '新增机型分类',
                onClick: handleCreateModel,
                disabled: mutationLoading
              }}
            />
          )}
        </>
      )}
      
      {/* 机型分类CRUD抽屉 */}
      {drawerMode && productType && (
        <ModelClassificationCrudDrawer
          mode={drawerMode}
          data={selectedModel || undefined}
          productType={productType}
          isLoading={mutationLoading}
          onClose={handleCloseDrawer}
          onSave={handleSaveModel}
          onDelete={handleDeleteModelConfirm}
        />
      )}

    </ModernLayout>
  );
};


export default ModelClassificationPage; 