# 添加"我发布的"统计功能 - 实现计划

## [x] Task 1: 在前端 API 中添加获取用户发布物品数量的接口
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 `frontend/src/api/items.ts` 中添加获取用户发布物品总数的函数
  - 可以复用 `getMyItems` 接口，使用 limit=1 来获取总数
  - 或者直接调用一次获取总数
- **Acceptance Criteria Addressed**: [FR-2]
- **Test Requirements**:
  - `programmatic` TR-1.1: 新增的 API 函数能够正常调用并返回正确的总数
  - `human-judgement` TR-1.2: 代码风格与现有 API 函数保持一致
- **Notes**: 使用现有的 `/api/items/mine` 接口

## [x] Task 2: 修改个人中心页面添加统计项
- **Priority**: P0
- **Depends On**: [Task 1]
- **Description**: 
  - 在 `frontend/src/pages/profile/profile.vue` 的 stats 对象中添加 `published` 字段
  - 在模板中添加第5个统计项"我发布的"
  - 添加加载统计数据的函数
- **Acceptance Criteria Addressed**: [FR-1, FR-2]
- **Test Requirements**:
  - `programmatic` TR-2.1: stats 对象包含 published 字段
  - `human-judgement` TR-2.2: 模板中新增的统计项 UI 布局正确
- **Notes**: 保持与现有统计项相同的样式

## [x] Task 3: 实现统计数据加载逻辑
- **Priority**: P0
- **Depends On**: [Task 2]
- **Description**: 
  - 在 `loadStats` 或新增函数中加载用户发布物品数量
  - 在 `checkLoginStatus` 中调用新的加载函数
  - 未登录时重置为0
- **Acceptance Criteria Addressed**: [FR-2, FR-4, NFR-1]
- **Test Requirements**:
  - `programmatic` TR-3.1: 已登录用户能正确加载统计数量
  - `programmatic` TR-3.2: 未登录用户统计数量为0
  - `programmatic` TR-3.3: 页面显示时数据会自动刷新

## [x] Task 4: 添加点击跳转功能
- **Priority**: P0
- **Depends On**: [Task 2]
- **Description**: 
  - 添加 `goToMyItems` 函数（或复用现有的）
  - 在统计项上绑定点击事件
  - 未登录时跳转到登录页面
- **Acceptance Criteria Addressed**: [FR-3, FR-4]
- **Test Requirements**:
  - `programmatic` TR-4.1: 已登录用户点击跳转到我的发布页面
  - `programmatic` TR-4.2: 未登录用户点击跳转到登录页面
  - `human-judgement` TR-4.3: 跳转流畅，无卡顿

## [x] Task 5: 调整统计区样式适配5个统计项
- **Priority**: P1
- **Depends On**: [Task 2]
- **Description**: 
  - 调整 `.stats-grid` 的样式以适应5个统计项
  - 确保每个统计项宽度合适
  - 保持响应式布局
- **Acceptance Criteria Addressed**: [FR-1, NFR-2]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 5个统计项布局美观，宽度均匀
  - `human-judgement` TR-5.2: 在不同屏幕尺寸下显示正常
