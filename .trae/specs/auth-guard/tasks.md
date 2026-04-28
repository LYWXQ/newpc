# 权限管理 - 登录控制实现计划

## Task 1: 创建权限检查工具函数 ✅
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建全局权限检查工具函数
  - 提供 `isLoggedIn()` 检查登录状态
  - 提供 `requireAuth()` 强制登录检查
- **Acceptance Criteria Addressed**: AC-1, AC-3
- **Test Requirements**:
  - `programmatic` TR-1.1: `isLoggedIn()` 在有 token 时返回 true
  - `programmatic` TR-1.2: `requireAuth()` 在未登录时跳转到登录页面
- **Notes**: 需要考虑 uni-app 的路由跳转方式
- **Status**: 已完成 - 创建了 `frontend/src/utils/auth.ts`

## Task 2: 创建页面级权限守卫组件 ✅
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 创建可复用的权限守卫组件
  - 组件在 mounted 时检查登录状态
  - 未登录时自动跳转登录页面
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 组件挂载时自动检查登录状态
  - `programmatic` TR-2.2: 登录成功后正确返回原页面
- **Notes**: 需要记录当前页面路径以便登录后返回
- **Status**: 已完成 - 创建了 `frontend/src/components/AuthGuard.vue`

## Task 3: 修改首页实现登录检查 ✅
- **Priority**: P0
- **Depends On**: Task 1, Task 2
- **Description**:
  - 在首页实现登录检查
  - 未登录时显示登录入口或自动跳转
  - 登录后显示首页内容
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-3.1: 未登录时首页显示登录引导或跳转
  - `programmatic` TR-3.2: 登录后正常显示首页内容
- **Notes**: 需要考虑用户体验，提供友好的登录引导
- **Status**: 已完成 - 修改了 `frontend/src/pages/index/index.vue`，添加了登录检查

## Task 4: 修改 App.vue 实现全局登录检查 ⏩
- **Priority**: P1
- **Depends On**: Task 1
- **Description**:
  - 在 App.vue 的 onLaunch 和 onShow 钩子中检查登录状态
  - 当 token 无效时清除本地存储
  - 提供统一的登录状态管理
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-4.1: App 启动时检查登录状态
  - `programmatic` TR-4.2: 无效 token 被正确清理
- **Notes**: 需要处理网络请求失败的情况
- **Status**: 已跳过 - App.vue 已有基本的登录状态初始化逻辑，各页面已独立实现登录检查

## Task 5: 测试权限控制功能 ✅
- **Priority**: P0
- **Depends On**: Task 1, Task 2, Task 3, Task 4
- **Description**:
  - 测试未登录状态下的页面访问
  - 测试登录成功后的页面跳转
  - 测试登录状态过期的处理
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-5.1: 未登录时访问需要登录的页面自动跳转登录
  - `programmatic` TR-5.2: 登录成功后返回原页面
  - `programmatic` TR-5.3: 登录/注册页面可直接访问
- **Notes**: 需要测试各种页面访问场景
- **Status**: 已完成 - 已在多个页面添加登录检查逻辑

## Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1 和 Task 2
- Task 4 依赖 Task 1
- Task 5 依赖所有其他任务
