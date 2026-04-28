# 消息功能问题修复 - 实施计划

## 问题分析
1. **导航问题**：个人中心的"我的消息"多次点击后才会跳转到消息界面，出现 `navigateTo:fail can not navigateTo a tabbar page` 错误
2. **消息显示问题**：user1给user发送了消息，个人中心出现了红点提示有新消息，但消息界面没有这条消息

## [x] 任务1: 修复个人中心到消息页面的导航问题
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 检查消息页面是否为tabbar页面
  - 修改 `goToMessages` 函数，使用正确的导航方法
  - 确保导航逻辑正确执行
- **Success Criteria**:
  - 点击"我的消息"能立即跳转到消息页面
  - 无导航错误
- **Test Requirements**:
  - `programmatic` TR-1.1: 点击"我的消息"后成功导航到消息页面
  - `human-judgment` TR-1.2: 导航过程流畅，无卡顿
- **Notes**: 消息页面可能是tabbar页面，需要使用 `uni.switchTab` 而非 `uni.navigateTo`

## [x] 任务2: 修复消息页面不显示聊天消息的问题
- **Priority**: P0
- **Depends On**: 任务1
- **Description**:
  - 检查消息页面的 `getMessageList` 调用
  - 验证后端API返回的聊天消息数据
  - 确保聊天消息正确显示在界面上
- **Success Criteria**:
  - 消息页面能正确显示所有聊天消息
  - user1发送的消息能在消息页面看到
- **Test Requirements**:
  - `programmatic` TR-2.1: 消息页面能显示user1发送给user的消息
  - `programmatic` TR-2.2: 未读消息数与实际消息数量一致
- **Notes**: 可能需要检查消息页面的tab切换逻辑和API调用参数

## [x] 任务3: 优化消息页面的消息加载逻辑
- **Priority**: P1
- **Depends On**: 任务2
- **Description**:
  - 确保消息页面在切换tab时重新加载数据
  - 优化消息列表的刷新机制
  - 确保未读消息标记正确
- **Success Criteria**:
  - 切换到"聊天消息"tab时能正确加载数据
  - 消息状态更新及时
- **Test Requirements**:
  - `programmatic` TR-3.1: 切换tab后消息列表正确更新
  - `human-judgment` TR-3.2: 消息加载过程流畅
- **Notes**: 检查 `fetchMessageList` 函数的调用时机

## [x] 任务4: 验证完整的消息流程
- **Priority**: P1
- **Depends On**: 任务3
- **Description**:
  - 测试从发送消息到接收消息的完整流程
  - 验证未读消息提示是否正确
  - 确保消息状态同步
- **Success Criteria**:
  - 完整的消息发送接收流程正常
  - 未读消息提示准确
- **Test Requirements**:
  - `programmatic` TR-4.1: user1发送消息后user能收到
  - `programmatic` TR-4.2: 未读消息数正确显示
- **Notes**: 测试时需要两个用户账号
