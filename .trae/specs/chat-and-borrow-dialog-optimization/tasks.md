# 聊天功能与借用弹窗优化任务清单

## [x] 任务1: 完善聊天页面基础对话功能
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 检查并完善 chat.vue 页面现有功能
  - 确保消息发送和接收正常
  - 实现消息列表自动滚动到底部
  - 添加下拉刷新加载更多历史消息
  - 优化消息气泡样式和布局
- **Acceptance Criteria Addressed**: AC-1
- **Notes**: 使用现有 API，确保前后端对接正常

## [x] 任务2: 创建借用信息弹窗组件
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建自定义借用弹窗组件 BorrowDialog
  - 弹窗包含开始时间、结束时间选择区域
  - 弹窗包含备注信息输入框
  - 弹窗大小适配屏幕，宽度 80%，最大高度 70%
  - 包含确认和取消按钮
- **Acceptance Criteria Addressed**: AC-2
- **Notes**: 使用自定义实现，不使用 uni.showModal

## [x] 任务3: 实现日期时间选择器（精确到时分）
- **Priority**: P0
- **Depends On**: 任务2
- **Description**:
  - 使用 uni-app 的 picker-view 组件实现日期时间选择
  - 支持选择年、月、日、时、分
  - 默认开始时间为当前时间
  - 默认结束时间为当前时间 + 7天
  - 结束时间不能早于开始时间
- **Acceptance Criteria Addressed**: AC-3
- **Notes**: 参考 uni-app 官方 picker 组件用法

## [x] 任务4: 在物品详情页集成借用弹窗
- **Priority**: P0
- **Depends On**: 任务2, 任务3
- **Description**:
  - 修改 item-detail.vue 页面
  - 替换原有的 uni.showModal 借用流程
  - 集成新的 BorrowDialog 组件
  - 实现时间选择逻辑
  - 实现订单提交逻辑
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Notes**: 保持原有订单创建 API 调用逻辑

## [x] 任务5: 测试与验证
- **Priority**: P1
- **Depends On**: 任务1, 任务4
- **Description**:
  - 测试聊天功能发送和接收消息
  - 测试借用弹窗显示效果
  - 测试日期时间选择功能
  - 测试订单提交流程
  - 验证在不同屏幕尺寸下的显示效果
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Notes**: 在模拟器和真机上进行测试

# Task Dependencies
- 任务3 依赖 任务2
- 任务4 依赖 任务2, 任务3
- 任务5 依赖 任务1, 任务4
