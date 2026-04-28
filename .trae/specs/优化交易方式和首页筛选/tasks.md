# 优化交易方式和首页筛选 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 修改发布页面 - 交易方式改为标签选择
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改发布页面的交易方式从单选框改为标签选择
  - 保持原有的"免费"、"租用"、"转卖"三个选项
  - 保持选中状态的视觉反馈
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `human-judgement` TR-1.1: 交易方式显示为标签而非单选框
  - `human-judgement` TR-1.2: 选中状态有明显的视觉反馈
- **Notes**: 保持功能逻辑保持不变，只改 UI

## [x] Task 2: 修改发布页面 - "位置"改为"交易地点"
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 将发布页面中"位置"标签文字改为"交易地点"
  - placeholder 文字也相应调整
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `human-judgement` TR-2.1: 标签显示为"交易地点"
  - `human-judgement` TR-2.2: placeholder 文字也相应调整
- **Notes**: 只修改文字，不改变功能

## [x] Task 3: 更新 API 类型定义 - 添加 transactionType 参数

## [x] Task 4-6: 首页添加筛选并修复加载异常
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 ItemListParams 接口中添加 transactionType 参数
  - 更新 getItemList API 支持传递该参数
- **Acceptance Criteria Addressed**: [AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-3.1: ItemListParams 包含 transactionType 字段
  - `programmatic` TR-3.2: getItemList 可以传递 transactionType 参数
- **Notes**: transactionType 可选值：'free' | 'rent' | 'sell' | undefined

## [ ] Task 4: 首页添加交易类型筛选标签
- **Priority**: P0
- **Depends On**: [Task 3]
- **Description**: 
  - 在首页分类筛选下方添加交易类型筛选
  - 包含四个标签：全部、免费、可租、购买
  - 添加状态管理
- **Acceptance Criteria Addressed**: [AC-3, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 显示四个筛选标签
  - `human-judgement` TR-4.2: 选中状态有视觉反馈
  - `programmatic` TR-4.3: 点击标签可以切换选中状态
- **Notes**: 标签样式与分类筛选保持一致

## [ ] Task 5: 首页实现两类筛选同时生效
- **Priority**: P0
- **Depends On**: [Task 3, Task 4]
- **Description**: 
  - 修改 loadRecommendedItems 和 loadLatestItems 函数
  - 同时传递 category 和 transactionType 参数
  - 当筛选变化时重新加载数据
- **Acceptance Criteria Addressed**: [AC-4, AC-5]
- **Test Requirements**:
  - `programmatic` TR-5.1: 同时传递两个筛选参数
  - `programmatic` TR-5.2: 筛选变化时重新加载数据
  - `programmatic` TR-5.3: 显示同时满足两个条件的物品
- **Notes**: 全部不传递 transactionType 参数

## [ ] Task 6: 修复首页加载异常
- **Priority**: P0
- **Depends On**: [Task 4, Task 5]
- **Description**: 
  - 检查并修复首页可能导致加载异常的代码
  - 确保数据加载逻辑正确
  - 添加错误处理
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `programmatic` TR-6.1: 首页可以正常加载
  - `programmatic` TR-6.2: 无控制台错误
  - `human-judgement` TR-6.3: 物品列表正常显示
- **Notes**: 确保所有功能正常工作
