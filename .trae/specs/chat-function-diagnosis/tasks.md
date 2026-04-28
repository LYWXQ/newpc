# 对话功能异常修复 - 实现计划

## [x] 任务 1：修复发送消息 API 返回值处理错误
- **优先级**: P0
- **Depends On**: None
- **Description**: 
  - 修改 `frontend/src/api/messages.ts` 中的 `sendMessage` 函数
  - 正确处理后端返回的 `{ message, data }` 结构
  - 返回实际的 `Message` 对象
- **Acceptance Criteria Addressed**: 发送消息后前端能正确获取消息内容进行展示
- **Test Requirements**:
  - `programmatic`: 发送消息后，返回值应为 `Message` 类型，包含 `id`, `content`, `senderId`, `receiverId` 等字段
  - `human-judgement`: 发送消息后能立即在聊天界面看到新消息

## [x] 任务 2：修复物品详情页跳转链接错误
- **优先级**: P0
- **Depends On**: None
- **Description**: 
  - 修改 `frontend/src/pages/chat/chat.vue` 中的 `navigateToItemDetail` 函数
  - 将跳转链接从 `/pages/items/detail` 修正为 `/pages/item-detail/item-detail`
- **Acceptance Criteria Addressed**: 用户点击物品信息栏能正确跳转到物品详情页
- **Test Requirements**:
  - `programmatic`: 点击物品信息栏后，页面导航到正确的物品详情页
  - `human-judgement`: 物品信息栏可点击，跳转后显示正确的物品详情

## [x] 任务 3：修复聊天页面对方用户信息获取逻辑缺陷
- **优先级**: P1
- **Depends On**: None
- **Description**: 
  - 修改 `frontend/src/pages/chat/chat.vue` 中的对方用户信息获取逻辑
  - 完善判断逻辑，正确处理当前用户是发送者或接收者的情况
  - 根据消息发送者/接收者身份正确获取对方用户信息
- **Acceptance Criteria Addressed**: 聊天页面能正确显示对方用户的头像和昵称
- **Test Requirements**:
  - `programmatic`: 无论当前用户是发送者还是接收者，都能正确获取对方用户信息
  - `human-judgement`: 聊天页面正确显示对方用户信息

## [x] 任务 4：修复后端发送消息接口参数类型不一致
- **优先级**: P2
- **Depends On**: None
- **Description**: 
  - 修改 `backend/routes/messages.js` 中的发送消息接口
  - 对 `receiverId` 进行类型转换，确保为整数类型
- **Acceptance Criteria Addressed**: 消息数据类型一致，查询正常
- **Test Requirements**:
  - `programmatic`: 发送消息接口能正确处理字符串和数字类型的 receiverId
  - `human-judgement`: 消息发送功能正常工作

## [x] 任务 5：修复聊天会话列表分页逻辑问题
- **优先级**: P2
- **Depends On**: None
- **Description**: 
  - 修改 `frontend/src/pages/messages/messages.vue` 中的分页逻辑
  - 使用后端返回的 `pagination.totalPages` 判断是否还有更多数据
- **Acceptance Criteria Addressed**: 分页逻辑精确，避免不必要的请求
- **Test Requirements**:
  - `programmatic`: 分页逻辑使用后端分页元数据进行判断
  - `human-judgement`: 消息列表分页加载正常