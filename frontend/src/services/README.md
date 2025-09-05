# 统一数据服务架构指南

## 🚀 概述

这是一个统一的数据管理架构，解决了原系统中数据访问方式不一致、日期格式不统一、Service层不完整等问题。

## 📁 架构组成

```
src/services/
├── dataManager.ts      # 统一数据管理中心
├── unifiedService.ts   # 统一服务层
├── README.md          # 使用指南（本文件）
├── modelService.ts    # 原有服务（保持兼容）
└── codeUsageService.ts # 原有服务（保持兼容）
```

## 🏗 核心组件

### 1. DataManager - 数据管理中心
- **单例模式**，确保全局数据一致性
- **统一数据访问**，所有数据操作通过此中心
- **数据统计功能**，提供实时数据统计信息

### 2. BaseDataService - 服务基类
- **统一响应格式**，所有API返回标准DataResponse
- **统一错误处理**，集中处理异常情况
- **数据验证基础**，提供通用验证方法

### 3. DateFormatter - 日期格式管理
- **统一日期格式**：存储格式(YYYY-MM-DD)、显示格式(YYYY/MM/DD)
- **自动转换功能**，在存储和显示间自动转换

### 4. IdGenerator - ID生成器
- **唯一ID生成**，确保所有记录ID的唯一性
- **时间戳结合**，提供更好的唯一性保证

### 5. DataValidator - 数据验证器
- **统一验证规则**，所有实体使用相同的验证逻辑
- **详细错误信息**，提供明确的验证失败原因

## 🔧 使用方法

### 基本用法

```typescript
import { unifiedServices } from '../services/unifiedService';

// 获取所有产品类型
const response = await unifiedServices.productType.getAllProductTypes();
if (response.success) {
  // 产品类型数据处理逻辑
} else {
  console.error('错误:', response.error);
}
```

### 页面组件中使用

```typescript
// ✅ 推荐：使用统一服务
import { unifiedServices } from '../services/unifiedService';
import { useEffect, useState } from 'react';

const MyPage: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await unifiedServices.productType.getAllProductTypes();
      if (response.success) {
        setData(response.data || []);
      } else {
        setError(response.error || '加载失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error}</div>}
      {data.map(item => (
        <div key={item.id}>{item.code}</div>
      ))}
    </div>
  );
};
```

## 📋 各服务API详解

### 产品类型服务 (ProductType)

```typescript
// 获取所有产品类型
await unifiedServices.productType.getAllProductTypes()

// 根据ID获取产品类型
await unifiedServices.productType.getProductTypeById(id)

// 添加新产品类型
await unifiedServices.productType.addProductType({
  code: 'PCB'
})

// 更新产品类型
await unifiedServices.productType.updateProductType(id, {
  code: 'FPC'
})

// 删除产品类型
await unifiedServices.productType.deleteProductType(id)
```

### 机型分类服务 (ModelClassification)

```typescript
// 获取所有机型分类
await unifiedServices.modelClassification.getAllModelClassifications()

// 根据产品类型获取机型分类
await unifiedServices.modelClassification.getModelClassificationsByProductType('PCB')

// 添加机型分类
await unifiedServices.modelClassification.addModelClassification({
  type: 'SLU-',
  description: ['製程投收料', '非多軸機械手'],
  productType: 'PCB'
})
```

### 代码分类服务 (CodeClassification)

```typescript
// 获取所有代码分类
await unifiedServices.codeClassification.getAllCodeClassifications()

// 根据机型类型获取代码分类
await unifiedServices.codeClassification.getCodeClassificationsByModelType('SLU-')

// 添加代码分类
await unifiedServices.codeClassification.addCodeClassification({
  code: '1-内層',
  modelType: 'SLU-'
})
```

### 代码使用清单服务 (CodeUsage)

```typescript
// 获取所有代码使用记录（不包含已删除）
await unifiedServices.codeUsage.getAllCodeUsages()

// 获取所有记录（包含已删除）
await unifiedServices.codeUsage.getAllCodeUsages(true)

// 根据机型和代码编号获取记录
await unifiedServices.codeUsage.getCodeUsagesByModelAndCode('SLU-', '1')

// 添加新记录
await unifiedServices.codeUsage.addCodeUsage({
  model: 'SLU-001',
  codeNumber: '1',
  extension: 'A',
  productName: '横向内层暂放板机',
  description: '用于PCB内层板材的横向暂存处理',
  occupancyType: '规划',
  builder: '张工程师',
  requester: '李经理'
})

// 软删除记录
await unifiedServices.codeUsage.softDeleteCodeUsage(id)

// 恢复已删除记录
await unifiedServices.codeUsage.restoreCodeUsage(id)
```

### 战情中心服务 (WarRoom)

```typescript
// 获取完整战情中心数据
await unifiedServices.warRoom.getWarRoomData()

// 获取年度新增机型数据
await unifiedServices.warRoom.getYearlyNewModels()

// 获取规划占用数据
await unifiedServices.warRoom.getPlanningUsage()

// 获取机型码余量数据
await unifiedServices.warRoom.getModelCodeRemaining()

// 根据机型获取新增代码数据
await unifiedServices.warRoom.getNewCodeDataByModel('SLU')
```

### 仪表盘服务 (Dashboard)

```typescript
// 获取仪表盘统计数据
await unifiedServices.dashboard.getDashboardStats()
```

## 🔄 迁移指南

### 从旧服务迁移

```typescript
// ❌ 旧方式 - 直接访问mockData
import { mockData } from '../mock/mockData';
const products = mockData.productTypes;

// ✅ 新方式 - 使用统一服务
import { unifiedServices } from '../services/unifiedService';
const response = await unifiedServices.productType.getAllProductTypes();
const products = response.success ? response.data : [];
```

```typescript
// ❌ 旧方式 - 使用旧service
import { ModelService } from '../services/modelService';
const products = ModelService.ProductType.getAllProductTypes();

// ✅ 新方式 - 使用统一服务
import { unifiedServices } from '../services/unifiedService';
const response = await unifiedServices.productType.getAllProductTypes();
const products = response.success ? response.data : [];
```

### 错误处理迁移

```typescript
// ❌ 旧方式 - 没有统一错误处理
try {
  const data = ModelService.ProductType.getAllProductTypes();
  setProducts(data);
} catch (error) {
  console.error(error);
}

// ✅ 新方式 - 统一错误处理
const response = await unifiedServices.productType.getAllProductTypes();
if (response.success) {
  setProducts(response.data || []);
  showMessage(response.message); // 显示成功消息
} else {
  setError(response.error || '操作失败');
}
```

## 📊 响应格式

所有统一服务都返回标准的DataResponse格式：

```typescript
interface DataResponse<T> {
  success: boolean;    // 操作是否成功
  data?: T;           // 返回的数据（成功时存在）
  error?: string;     // 错误信息（失败时存在）
  message?: string;   // 操作消息（可选）
}
```

### 成功响应示例

```json
{
  "success": true,
  "data": [
    { "id": "1", "code": "PCB" },
    { "id": "2", "code": "FPC" }
  ],
  "message": "成功获取2个产品类型"
}
```

### 错误响应示例

```json
{
  "success": false,
  "error": "产品代码不能为空"
}
```

## 🛠 开发建议

### 1. 统一使用async/await

```typescript
// ✅ 推荐
const loadData = async () => {
  const response = await unifiedServices.productType.getAllProductTypes();
  // 处理响应
};

// ❌ 不推荐
const loadData = () => {
  unifiedServices.productType.getAllProductTypes().then(response => {
    // 处理响应
  });
};
```

### 2. 统一错误处理

```typescript
// ✅ 推荐 - 统一错误处理模式
const handleServiceResponse = <T>(
  response: DataResponse<T>,
  onSuccess: (data: T) => void,
  onError?: (error: string) => void
) => {
  if (response.success && response.data) {
    onSuccess(response.data);
    if (response.message) {
      showSuccessMessage(response.message);
    }
  } else {
    const errorMsg = response.error || '操作失败';
    if (onError) {
      onError(errorMsg);
    } else {
      showErrorMessage(errorMsg);
    }
  }
};

// 使用示例
const response = await unifiedServices.productType.getAllProductTypes();
handleServiceResponse(
  response,
  (data) => setProductTypes(data),
  (error) => setError(error)
);
```

### 3. 类型安全

```typescript
// ✅ 推荐 - 使用TypeScript类型
import type { ProductType, DataResponse } from '../mock/interfaces';

const [productTypes, setProductTypes] = useState<ProductType[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string>('');
```

## 🔧 配置与扩展

### 添加新的服务

```typescript
// 1. 在unifiedService.ts中添加新的服务类
export class UnifiedNewService extends BaseDataService<NewType> {
  private dataManager = DataManager.getInstance();
  
  async getNewData(): Promise<DataResponse<NewType[]>> {
    try {
      // 实现逻辑
      return this.success(data, '成功获取数据');
    } catch (error) {
      return this.error(`获取数据失败: ${error}`);
    }
  }
}

// 2. 添加到统一服务导出
export const unifiedServices = {
  // 现有服务...
  newService: new UnifiedNewService()
};
```

### 自定义验证器

```typescript
// 在DataValidator中添加新的验证方法
export class DataValidator {
  // 现有验证方法...
  
  static validateNewType(data: Partial<NewType>): string | null {
    if (!data.requiredField) {
      return '必要字段不能为空';
    }
    // 其他验证逻辑
    return null;
  }
}
```

## 🚨 注意事项

1. **向后兼容**：原有的service文件保持不变，确保现有代码正常运行
2. **逐步迁移**：建议按页面逐步迁移到新的统一服务
3. **错误处理**：始终检查response.success，不要直接使用response.data
4. **性能考虑**：DataManager使用单例模式，避免重复实例化
5. **日期格式**：统一使用DateFormatter处理日期，避免格式不一致

## 📈 性能监控

```typescript
// 获取数据统计信息
const stats = DataManager.getInstance().getStats();
// 数据统计结果可用于业务逻辑处理

// 输出示例:
{
  productTypes: 2,
  modelClassifications: 4,
  codeClassifications: 12,
  totalCodeUsages: 15,
  activeCodeUsages: 14,
  deletedCodeUsages: 1,
  lastUpdated: "2024-08-06"
}
```

## 🔄 版本历史

- **v1.0.0** - 初始版本，统一数据架构
- 统一了数据访问方式
- 统一了日期格式
- 完善了Service层覆盖
- 添加了统一的错误处理
- 实现了数据验证机制