# 登录检查逻辑优化计划

## 1. 问题分析

### 当前现状
通过代码搜索发现，项目中存在多处重复的登录检查逻辑：

**profile.vue** - 8处重复检查：
```typescript
if (!authStore.isLoggedIn) {
  goToLogin()
  return
}
```

**item-detail.vue** - 3处重复检查

### 问题评估

| 问题 | 影响 |
|------|------|
| 代码冗余 | 每个页面函数都重复相同的检查逻辑 |
| 维护困难 | 修改登录检查逻辑需要修改多处 |
| 不一致风险 | 不同页面可能有不同的检查实现 |
| 可读性差 | 业务逻辑被大量检查代码淹没 |

### 根本原因
没有统一的登录检查机制，每个函数独立进行检查。

## 2. 优化方案

### 方案A: 创建统一的权限检查工具函数（推荐）

**优点**: 
- 统一管理登录检查逻辑
- 易于维护和修改
- 代码简洁

**实现方式**:
```typescript
// src/utils/auth.ts
export const requireAuth = (): boolean => {
  if (!isLoggedIn()) {
    uni.navigateTo({ url: '/pages/login/login' })
    return false
  }
  return true
}
```

**使用方式**:
```typescript
const goToOrders = () => {
  if (!requireAuth()) return
  // 业务逻辑
}
```

### 方案B: 使用高阶函数包装

**优点**:
- 更加简洁
- 函数式编程风格

**实现方式**:
```typescript
export const withAuth = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: any[]) => {
    if (!isLoggedIn()) {
      uni.navigateTo({ url: '/pages/login/login' })
      return
    }
    return fn(...args)
  }) as T
}
```

**使用方式**:
```typescript
const goToOrders = withAuth(() => {
  // 业务逻辑
})
```

### 方案选择
推荐使用 **方案A**，因为：
1. 更直观，易于理解
2. 兼容性更好
3. 错误处理更灵活

## 3. 优化步骤

### 步骤1: 更新权限检查工具函数
在 `src/utils/auth.ts` 中添加统一的登录检查函数

### 步骤2: 优化 profile.vue
将所有分散的登录检查替换为统一的工具函数调用

### 步骤3: 优化 item-detail.vue
同样替换为统一的工具函数调用

### 步骤4: 验证优化效果
确保登录检查功能正常工作

## 4. 修改的文件

| 文件 | 修改内容 |
|------|----------|
| `src/utils/auth.ts` | 添加 `requireAuth()` 函数 |
| `src/pages/profile/profile.vue` | 使用 `requireAuth()` 替换重复检查 |
| `src/pages/item-detail/item-detail.vue` | 使用 `requireAuth()` 替换重复检查 |

## 5. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 函数调用方式改变 | 低 | 保持向后兼容，添加新函数而非修改现有函数 |
| 页面跳转行为变化 | 低 | 使用相同的跳转逻辑 |
| 现有功能受影响 | 低 | 充分测试 |

## 6. 预期效果

优化前（profile.vue）:
```typescript
const goToOrders = (role: 'lender' | 'borrower' = 'borrower') => {
  if (!authStore.isLoggedIn) {
    goToLogin()
    return
  }
  uni.setStorageSync('orderRole', role)
  uni.switchTab({ url: '/pages/orders/orders' })
}
```

优化后（profile.vue）:
```typescript
const goToOrders = (role: 'lender' | 'borrower' = 'borrower') => {
  if (!requireAuth()) return
  uni.setStorageSync('orderRole', role)
  uni.switchTab({ url: '/pages/orders/orders' })
}
```

**代码减少量**: 每个函数减少约 3 行重复代码
**profile.vue**: 约减少 24 行重复代码
**item-detail.vue**: 约减少 9 行重复代码

## 7. 验证方法

1. 未登录状态下点击各功能按钮，应跳转到登录页面
2. 登录状态下点击各功能按钮，应正常执行业务逻辑
3. 退出登录后再次点击，应重新跳转登录页面
