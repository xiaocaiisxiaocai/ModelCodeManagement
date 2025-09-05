import { useParams, useNavigate } from 'react-router-dom';
import ModernLayout from '../components/ModernLayout';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CodeClassification } from '../types/domain';

// 定义表单数据类型
interface CodeClassificationFormData {
  code: string;
  name: string;
  modelType: string;
  sortOrder?: number;
}
import CodeClassificationCrudDrawer from '../components/CodeClassificationCrudDrawer';
import { Button, Card, CardBody, Badge, EmptyState, PageHeader } from '../components/ui';

import { services } from '../services';
import { useServiceResponse } from '../hooks/useServiceResponse';
import { useApi } from '../hooks/useApi';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

const CodeClassificationPage: React.FC = () => {
  const { productType, modelType } = useParams<{
    productType: string;
    modelType: string;
  }>();
  const navigate = useNavigate();
  const { loading: mutationLoading, handleResponse, showSuccess, showError } = useServiceResponse();

  // 使用 useApi Hook 获取数据
  const getCodeClassifications = useCallback(() => {
    if (!modelType) {
      return Promise.resolve({ success: true, data: [] });
    }
    return services.codeClassification.getByModelType(modelType);
  }, [modelType]);

  const { data: codeClassifications, loading: dataLoading, error: dataError, refetch: loadCodeClassifications } = useApi(
    getCodeClassifications,
    [modelType]
  );

  // 获取机型分类列表，用于获取机型分类ID
  const getModelClassifications = useCallback(() => services.modelClassification.getAll(), []);
  const { data: modelClassifications } = useApi(getModelClassifications);

  // 状态管理
  const [selectedCode, setSelectedCode] = useState<CodeClassification | null>(null);
  const [drawerMode, setDrawerMode] = useState<CrudMode | null>(null);

  
  // 处理进入代码使用清单
  const handleEnterCodeUsage = (code: CodeClassification) => {
    if (productType && modelType) {
      navigate(`/coding/code-usage/${productType}/${modelType}/${code.code}`);
    }
  };
  
  // 处理创建新代码分类
  const handleCreateCode = () => {
    setSelectedCode(null);
    setDrawerMode('create');
  };
  
  // 处理编辑代码分类
  const handleEditCode = (code: CodeClassification, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发查看详情
    setSelectedCode(code);
    setDrawerMode('update');
  };
  
  // 处理删除代码分类
  const handleDeleteCode = (code: CodeClassification, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发查看详情
    setSelectedCode(code);
    setDrawerMode('delete');
  };
  
  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedCode(null);
  };
  
  /**
   * 保存代码分类数据 - 新方式
   */
  const handleSaveCode = async (code: CodeClassification) => {
    let success = false;
    
    if (drawerMode === 'create') {
      // 获取机型分类ID
      const currentModelClassification = modelClassifications?.find(mc => mc.type === modelType);
      if (!currentModelClassification) {
        showError('创建代码分类失败: 无法找到机型分类');
        return;
      }

      // 构造创建数据，确保包含正确的机型分类ID
      const createData = {
        code: code.code,
        name: code.name,
        modelClassificationId: parseInt(currentModelClassification.id)
      };

      const result = await handleResponse(
        () => services.codeClassification.create(createData),
        (data) => {
          const classification = data as any;
          showSuccess(`成功创建代码分类: ${classification.code || classification.Code}`);
          success = true;
        },
        (errorMsg) => {
          showError(`创建代码分类失败: ${errorMsg}`);
        }
      );
      success = result !== null;
    } else if (drawerMode === 'update' && selectedCode) {
      const result = await handleResponse(
        () => services.codeClassification.update(selectedCode.id, code),
        (data) => {
          const classification = data as any;
          showSuccess(`成功更新代码分类: ${classification.code || classification.Code}`);
          success = true;
        },
        (errorMsg) => {
          showError(`更新代码分类失败: ${errorMsg}`);
        }
      );
      success = result !== null;
    }
    
    if (success) {
      handleCloseDrawer();
      await loadCodeClassifications();
    }
  };
  
  /**
   * 删除代码分类 - 新方式
   */
  const handleDeleteCodeConfirm = async (code: string) => {
    // 根据code找到对应的ID
    const codeClassification = Array.isArray(codeClassifications) 
      ? (codeClassifications as CodeClassification[]).find(cc => cc.code === code)
      : null;
    if (!codeClassification) {
      showError(`找不到代码分类: ${code}`);
      return;
    }

    const result = await handleResponse(
      () => services.codeClassification.delete(codeClassification.id),
      () => {
        showSuccess(`成功删除代码分类: ${code}`);
      },
      (errorMsg) => {
        showError(`删除代码分类失败: ${errorMsg}`);
      }
    );
    
    if (result !== null) {
      handleCloseDrawer();
      await loadCodeClassifications();
    }
  };

  // 使用 useMemo 优化排序，仅在 codeClassifications 变化时执行
  const sortedCodeClassifications = useMemo(() => {
    if (!codeClassifications) return [];
    return [...(codeClassifications as CodeClassification[])].sort((a, b) => {
      const numA = parseInt(a.code, 10);
      const numB = parseInt(b.code, 10);
      return numA - numB;
    });
  }, [codeClassifications]);

  return (
    <ModernLayout title={`代码分类 - ${modelType}`}>
      <PageHeader
        title="代码分类管理"
        subtitle={`管理 ${modelType} 机型下的所有代码分类`}
        breadcrumbs={[
          { label: '首页', to: '/' },
          { label: productType!, to: `/model-classification/${productType}` },
          { label: modelType! }
        ]}
        action={
          <Button
            onClick={handleCreateCode}
            icon={<span className="i-carbon-add"></span>}
            variant="primary"
            disabled={dataLoading || mutationLoading}
          >
            {dataLoading ? '加载中...' : '新增代码分类'}
          </Button>
        }
      />

      {/* 数据加载状态处理 */}
      {dataLoading && (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardBody className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-300 h-6 w-10 rounded"></div>
                  <div className="bg-gray-300 h-6 w-24 rounded"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-300 h-8 w-16 rounded"></div>
                  <div className="bg-gray-300 h-8 w-16 rounded"></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {dataError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="i-carbon-warning text-red-500 mr-3"></span>
            <p className="text-sm text-red-800">{dataError}</p>
            <Button onClick={loadCodeClassifications} variant="danger" size="sm" className="ml-auto">重试</Button>
          </div>
        </div>
      )}

      {/* 代码分类列表 */}
      {!dataLoading && !dataError && (
        <>
          {sortedCodeClassifications.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {sortedCodeClassifications.map((code) => {
            const codeNumber = code.code;
            const codeName = code.name || '';
            
            return (
              <Card
                key={code.code}
                hover
                clickable
                onClick={() => handleEnterCodeUsage(code)}
                className="transition-all duration-200"
              >
                <CardBody className="flex justify-between items-center py-4">
                  {/* 左侧：代码信息 */}
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" size="md">
                      {codeNumber}
                    </Badge>
                    <div className="text-lg font-medium text-gray-900">
                      {codeName}
                    </div>
                  </div>
                  
                  {/* 右侧：操作按钮 */}
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={(e) => handleEditCode(code, e)}
                      variant="warning"
                      size="sm"
                      disabled={mutationLoading}
                    >
                      编辑
                    </Button>
                    <Button
                      onClick={(e) => handleDeleteCode(code, e)}
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
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<span className="i-carbon-code"></span>}
          title="暂无代码分类"
          message="为此机型添加第一个代码分类，以便进行最终的编码管理。"
          action={{
            text: '新增代码分类',
            onClick: handleCreateCode,
            disabled: mutationLoading
          }}
        />
          )}
        </>
      )}
      
      {/* 代码分类CRUD抽屉 */}
      {drawerMode && modelType && (
        <CodeClassificationCrudDrawer
          mode={drawerMode}
          data={selectedCode || undefined}
          modelType={modelType}
          isLoading={mutationLoading}
          onClose={handleCloseDrawer}
          onSave={handleSaveCode}
          onDelete={handleDeleteCodeConfirm}
        />
      )}

    </ModernLayout>
  );
};


export default CodeClassificationPage; 