[根目录](../CLAUDE.md) > **frontend**

# Frontend 模块文档

## 模块职责

React 19 + TypeScript 前端单页应用，负责用户界面展示和交互。采用 Carbon Design System 设计语言，通过统一服务层与后端 API 通信，实现制造业编码管理的完整用户体验。

## 入口与启动

### 核心入口文件
- **主入口**: `src/main.tsx` - 应用启动和全局配置
- **应用根组件**: `src/App.tsx` - 路由配置和懒加载
- **构建配置**: `vite.config.ts` - Vite 构建和开发服务器配置

### 启动命令
```bash
npm run dev                    # 本地开发 (http://localhost:5173)
npm run dev:network           # 局域网访问 (http://0.0.0.0:5173)
npm run build                 # 生产构建
npm run preview               # 预览构建结果
npm run lint                  # ESLint 代码检查
```

### 开发服务器配置
```typescript
// vite.config.ts 核心配置
server: {
  host: '0.0.0.0',
  port: 5173,
  proxy: {
    '/api': 'http://localhost:5250'  // 后端API代理
  }
}
```

## 对外接口

### 路由体系 (React Router v6)
```typescript
// App.tsx - 主要路由配置
Routes:
├── /login                     # 登录页 (公开)
├── /unauthorized             # 无权限页 (公开)
├── /                         # 产品类型管理 (需认证)
├── /model-classification/:productType
├── /code-classification/:productType/:modelType
├── /code-usage/:productType/:modelType/:codeNumber
├── /direct-code-usage/:productType/:modelType  # 2层结构直接访问
├── /war-room                 # 战情中心
├── /data-dictionary          # 数据字典
└── /admin/*                  # 管理员功能 (需特定权限)
```

### API通信接口
```typescript
// src/services/unifiedService.ts - 统一服务层
export interface UnifiedServices {
  productType: UnifiedProductTypeService;      // 产品类型管理
  modelClassification: UnifiedModelClassificationService; // 机型分类管理
  codeClassification: UnifiedCodeClassificationService;   // 代码分类管理
  codeUsage: UnifiedCodeUsageService;         // 编码使用管理
  warRoom: UnifiedWarRoomService;             // 战情中心数据
  dashboard: UnifiedDashboardService;         // 仪表盘统计
}
```

### 权限控制接口
```typescript
// src/components/auth/PermissionGate.tsx
<PermissionGate requiredPermission="Entity.Create">
  <Button>创建</Button>
</PermissionGate>

// src/components/auth/ProtectedRoute.tsx  
<ProtectedRoute requiredRoles={['admin', 'superadmin']}>
  <AdminPage />
</ProtectedRoute>
```

## 关键依赖与配置

### 主要技术依赖
```json
{
  "dependencies": {
    "@carbon/icons-react": "^11.62.0",     // Carbon 图标库
    "@carbon/react": "^1.85.1",            // Carbon Design System
    "react": "^19.1.0",                    // React 19
    "react-dom": "^19.1.0",                // React DOM
    "react-router-dom": "^6.30.1",         // 路由管理
    "echarts": "^5.6.0",                   // 图表库
    "echarts-for-react": "^3.0.2",         // React ECharts 组件
    "@unocss/reset": "^66.3.3",            // CSS Reset
    "unocss": "^66.3.3"                    // 原子化CSS
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.6.0",      // Vite React 插件
    "typescript": "~5.8.3",                // TypeScript
    "eslint": "^9.30.1",                   // 代码检查
    "vite": "^7.0.3"                       // 构建工具
  }
}
```

### 样式和设计系统配置
```typescript
// uno.config.ts - UnoCSS 配置
presets: [
  presetUno(),
  presetAttributify(),
  presetIcons({
    collections: {
      carbon: () => import('@iconify-json/carbon/icons.json')
    }
  })
]
```

### TypeScript 配置
```json
// tsconfig.json 核心配置
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

## 数据模型

### 核心类型定义 (`src/mock/interfaces.ts`)
```typescript
// 统一响应格式
export interface DataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 核心业务实体
export interface ProductType {
  id: string;
  code: string;  // 如 'PCB', 'FPC'
}

export interface ModelClassification {
  type: string;                    // 如 'SLU-', 'SLUR-'
  description: string[];
  productType: string;
  hasCodeClassification?: boolean; // 控制2层/3层结构
}

export interface CodeClassification {
  code: string;      // 如 '1-内层', '2-薄板'
  modelType: string; // 关联机型类型
}

export interface CodeUsageEntry {
  id: string;
  model: string;        // 机型编号 (如 "SLU-101")
  codeNumber: string;   // 代码分类编号
  extension?: string;   // 延伸编号
  productName: string;  // 产品名称
  description: string;  // 说明
  occupancyType: string; // 占用类型
  builder: string;      // 建档人
  requester: string;    // 需求人
  creationDate: string; // 创建时间
  isDeleted: boolean;   // 软删除标志
}
```

### 用户和权限模型
```typescript
export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: 'user' | 'admin' | 'superadmin';
  department?: string;
  email?: string;
}
```

## 测试与质量

### 当前状态
- **单元测试**: ❌ 未实现
- **集成测试**: ❌ 未实现
- **E2E测试**: ❌ 未实现
- **代码检查**: ✅ ESLint 配置完成

### 建议测试策略
```bash
# 推荐测试技术栈
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event vitest jsdom
npm install -D cypress  # E2E 测试
```

### ESLint 配置
```javascript
// eslint.config.js - 主要规则
rules: {
  'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn'
}
```

## 常见问题 (FAQ)

### Q: 如何添加新的API服务？
A: 在 `src/services/unifiedService.ts` 中扩展服务类，继承 `BaseDataService`，并添加到 `unifiedServices` 导出对象中。

### Q: 如何处理权限控制？
A: 使用 `PermissionGate` 组件包装需要权限的UI元素，使用 `ProtectedRoute` 保护需要特定角色的路由。

### Q: 如何添加新的页面组件？
A: 1) 在 `src/pages/` 创建组件；2) 在 `App.tsx` 中添加懒加载导入；3) 配置路由和权限保护。

### Q: 如何自定义主题和样式？
A: 项目使用 UnoCSS + Carbon Design System，可以在 `uno.config.ts` 中自定义原子类，在 `src/styles/` 中添加全局样式。

### Q: 如何调试API请求？
A: 使用浏览器开发工具的网络面板，或在 `unifiedService.ts` 中添加 console.log 调试信息。

## 相关文件清单

### 核心配置文件
```
frontend/
├── package.json                    # 依赖管理和脚本配置
├── vite.config.ts                 # Vite 构建配置
├── uno.config.ts                  # UnoCSS 原子化样式配置
├── eslint.config.js               # ESLint 代码检查配置
├── tsconfig.json                  # TypeScript 配置
├── tsconfig.app.json              # 应用 TypeScript 配置
└── tsconfig.node.json             # Node.js TypeScript 配置
```

### 源码结构
```
src/
├── main.tsx                       # 应用入口
├── App.tsx                        # 根组件和路由配置
├── index.css                      # 全局样式
├── vite-env.d.ts                  # Vite 类型定义
├── services/                      # 服务层
│   ├── unifiedService.ts         # 统一API服务 (核心)
│   ├── dataManager.ts            # 数据管理器
│   └── README.md                 # 服务层使用指南
├── components/                    # React 组件
│   ├── ui/                       # 基础UI组件
│   └── auth/                     # 权限相关组件
├── pages/                        # 页面组件
├── contexts/                     # React Context (状态管理)
├── mock/                         # Mock 数据和类型定义
│   └── interfaces.ts            # 类型定义 (核心)
├── hooks/                        # 自定义 Hooks
└── styles/                       # 样式文件
```

### 文档和配置
```
frontend/
├── 设计概要文档.md                # 前端设计概要
├── src/services/README.md        # 统一服务架构指南
└── CLAUDE.md                     # 本文档
```

## 变更记录 (Changelog)

### v1.0.0 - 2025年08月26日
- ✅ **核心架构完成**: React 19 + TypeScript + Carbon Design System
- ✅ **统一服务层**: unifiedService.ts 统一API管理
- ✅ **权限控制**: ProtectedRoute 和 PermissionGate 组件
- ✅ **路由系统**: React Router v6 配置，支持2层/3层结构
- ✅ **样式系统**: UnoCSS + Carbon Design System
- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ⚠️ **测试覆盖**: 待实现单元测试和集成测试
- ⚠️ **组件文档**: 待补充组件库文档

---

**创建时间**: 2025年08月26日 10:20:31  
**模块状态**: ✅ 核心功能完成，可进行业务开发  
**技术栈版本**: React 19 + TypeScript 5.8 + Vite 7.0