# 代码规范与去冗余优化计划

## 1. 项目现状分析

### 技术栈
- **框架**: UniApp + Vue 3 + TypeScript
- **状态管理**: Pinia
- **构建工具**: Vite

### 当前冗余问题识别

#### 1.1 登录检查重复（已部分优化）
- **位置**: 多个页面文件
- **问题**: 每个页面独立实现登录检查逻辑
- **影响**: 维护困难，修改需改多处

#### 1.2 API调用模式重复
- **位置**: `src/api/` 目录
- **问题**: 每个API文件独立处理请求，缺少统一封装
- **影响**: 代码重复，错误处理不一致

#### 1.3 页面逻辑重复
- **位置**: `src/pages/` 目录
- **问题**: 相似页面（如 orders、favorites、reviews）结构相似
- **影响**: 重复代码量大，维护成本高

#### 1.4 工具函数分散
- **位置**: `src/utils/` 目录
- **问题**: 工具函数分散在多个文件，缺乏统一管理
- **影响**: 查找困难，可能存在重复实现

#### 1.5 组件复用不足
- **位置**: `src/components/` 目录
- **问题**: 只有1个组件，大量UI逻辑内嵌在页面中
- **影响**: 代码复用率低，一致性差

## 2. 规范化目标

### 2.1 代码结构规范
```
src/
├── api/          # API层（统一封装）
├── components/   # 可复用组件
├── composables/  # 组合式函数
├── pages/        # 页面组件
├── stores/       # Pinia状态管理
├── utils/        # 工具函数
└── types/        # 类型定义
```

### 2.2 编码规范
- 使用 Composition API（`<script setup>`）
- 统一的命名规范（camelCase）
- 一致的代码格式化（Prettier）
- 完整的类型定义

### 2.3 去冗余目标
| 模块 | 当前状态 | 优化目标 |
|------|----------|----------|
| 登录检查 | 分散在8+处 | 统一到 `checkLogin()` |
| API调用 | 独立封装 | 统一请求拦截 |
| 页面逻辑 | 重复率高 | 提取composables |
| 工具函数 | 分散 | 统一管理 |

## 3. 分阶段改造方案

### 阶段1: 基础规范化（P0）
- **时间**: 第1周
- **目标**: 建立统一的代码规范和工具链
- **任务**:
  - [ ] 配置 ESLint + Prettier
  - [ ] 配置 TypeScript 严格模式
  - [ ] 统一工具函数入口
  - [ ] 完成登录检查统一（已完成80%）

### 阶段2: API层重构（P0）
- **时间**: 第2周
- **目标**: 统一API调用方式
- **任务**:
  - [ ] 创建统一的请求封装
  - [ ] 添加请求/响应拦截器
  - [ ] 统一错误处理
  - [ ] 重构现有API文件

### 阶段3: Composables提取（P1）
- **时间**: 第3周
- **目标**: 提取可复用的业务逻辑
- **任务**:
  - [ ] 创建 useAuth composable
  - [ ] 创建 useItems composable
  - [ ] 创建 useOrders composable
  - [ ] 创建 useFavorites composable

### 阶段4: 组件化重构（P1）
- **时间**: 第4周
- **目标**: 提升组件复用率
- **任务**:
  - [ ] 提取公共列表组件
  - [ ] 提取表单组件
  - [ ] 提取弹窗组件
  - [ ] 提取TabBar封装

### 阶段5: 验证与测试（P0）
- **时间**: 第5周
- **目标**: 确保重构后功能正常
- **任务**:
  - [ ] 运行构建测试
  - [ ] 功能回归测试
  - [ ] 性能测试

## 4. 具体优化方案

### 4.1 工具函数统一管理
**方案**: 创建统一的工具函数入口

```typescript
// src/utils/index.ts
export * from './auth'
export * from './constants'
export * from './image'
export * from './request'
export * from './universities'
```

**使用方式**:
```typescript
import { checkLogin, formatItemStatus } from '@/utils'
```

### 4.2 统一API请求封装
**方案**: 创建统一的请求类

```typescript
// src/api/request.ts
class ApiClient {
  baseURL: string
  
  constructor(baseURL: string) {
    this.baseURL = baseURL
  }
  
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    // 统一处理请求
  }
  
  async post<T>(url: string, data?: Record<string, any>): Promise<T> {
    // 统一处理请求
  }
  
  // ...其他方法
}
```

### 4.3 Composables提取
**方案**: 将页面逻辑提取为composables

```typescript
// src/composables/useAuth.ts
export const useAuth = () => {
  const authStore = useAuthStore()
  
  const login = async (account: string, password: string) => {
    // 登录逻辑
  }
  
  const logout = () => {
    // 登出逻辑
  }
  
  const requireAuth = () => {
    // 权限检查
  }
  
  return { login, logout, requireAuth }
}
```

### 4.4 组件复用
**方案**: 提取公共组件

```typescript
// src/components/ItemCard.vue
<template>
  <view class="item-card">
    <!-- 物品卡片内容 -->
  </view>
</template>
```

## 5. 风险评估与回滚策略

### 5.1 风险清单
| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|----------|
| API重构影响范围大 | 高 | 修改API层可能影响所有页面 | 分模块重构，先测试再上线 |
| Composables引入新bug | 中 | 提取逻辑可能引入新问题 | 保留原实现作为fallback |
| 组件重构兼容性 | 中 | 组件修改可能影响页面样式 | 渐进式替换，逐个验证 |
| 类型错误 | 低 | TypeScript严格模式可能暴露隐式类型问题 | 逐步开启严格模式 |

### 5.2 回滚策略
1. **代码版本控制**: 每次重构前提交代码
2. **功能开关**: 关键功能保留老实现作为备用
3. **灰度发布**: 先在测试环境验证，再上线
4. **文档记录**: 记录重构前后的API变化

## 6. 验收标准

### 6.1 代码质量指标
| 指标 | 目标值 |
|------|--------|
| 代码重复率 | < 10% |
| ESLint错误数 | 0 |
| TypeScript错误数 | 0 |
| 单元测试覆盖率 | >= 80% |

### 6.2 功能验证
- [ ] 所有页面正常渲染
- [ ] 登录/登出流程正常
- [ ] API请求正常响应
- [ ] 页面间导航正常
- [ ] 数据持久化正常

## 7. 执行计划

### 第1周：基础规范化
1. 配置代码检查工具
2. 完成登录检查统一
3. 建立工具函数统一入口

### 第2周：API层重构
1. 创建统一请求封装
2. 添加拦截器
3. 重构现有API

### 第3周：Composables提取
1. 提取认证相关逻辑
2. 提取物品相关逻辑
3. 提取订单相关逻辑

### 第4周：组件化重构
1. 提取公共组件
2. 更新页面使用新组件

### 第5周：验证与测试
1. 运行构建和测试
2. 修复发现的问题
3. 文档整理

## 8. 预期效果

### 优化前
- 登录检查代码重复8+处
- API调用逻辑分散
- 页面逻辑重复率高
- 组件复用率低（< 20%）

### 优化后
- 登录检查统一到1处
- API调用统一封装
- 业务逻辑提取为composables
- 组件复用率提升（> 50%）
- 代码可维护性显著提升
