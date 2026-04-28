# 以物品为中心的聊天系统重构任务清单

## [x] 任务1: 数据库模型修改
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改 backend/models/message.js，添加 itemId 字段
  - 添加外键关联到 Item 表
  - 更新 backend/models/index.js 添加关联关系
- **Acceptance Criteria Addressed**: 消息数据模型修改
- **Notes**: 需要允许 itemId 为 null，兼容旧消息

## [x] 任务2: 后端 API 修改 - 消息列表筛选
- **Priority**: P0
- **Depends On**: 任务1
- **Description**: 
  - 修改 GET /messages 接口，支持按 type 正确筛选
  - 系统消息只返回 type='system' 的消息
  - 聊天消息按物品分组返回会话列表
- **Acceptance Criteria Addressed**: 消息按类型正确筛选
- **Notes**: 需要聚合查询获取每个会话的最新消息

## [x] 任务3: 后端 API 修改 - 聊天记录查询
- **Priority**: P0
- **Depends On**: 任务1
- **Description**: 
  - 修改 GET /messages/chat/:userId 接口
  - 支持 itemId 查询参数
  - 返回特定物品的聊天记录
- **Acceptance Criteria Addressed**: 以物品为中心的聊天
- **Notes**: 不传 itemId 时返回所有与该用户的聊天

## [x] 任务4: 后端 API 修改 - 发送消息
- **Priority**: P0
- **Depends On**: 任务1
- **Description**: 
  - 修改 POST /messages 接口
  - 支持传入 itemId 参数
  - 将消息与物品关联
- **Acceptance Criteria Addressed**: 以物品为中心的聊天
- **Notes**: itemId 为可选参数

## [x] 任务5: 后端 API - 清空用户对话
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 创建 DELETE /messages/clear-users 接口（管理员用）
  - 支持清空指定用户的所有消息
  - 清空 user 和 user1 的对话记录
- **Acceptance Criteria Addressed**: 清空用户对话记录
- **Notes**: 这是一个管理接口，需要权限验证

## [x] 任务6: 前端 API 接口更新
- **Priority**: P0
- **Depends On**: 任务2, 任务3, 任务4
- **Description**: 
  - 更新 frontend/src/api/messages.ts
  - 修改 Message 接口添加 itemId 和 item 字段
  - 更新 sendMessage 参数支持 itemId
  - 更新 getChatHistory 支持 itemId 参数
- **Acceptance Criteria Addressed**: 以物品为中心的聊天
- **Notes**: 保持向后兼容

## [x] 任务7: 前端消息列表页面修改
- **Priority**: P0
- **Depends On**: 任务6
- **Description**: 
  - 修改 frontend/src/pages/messages/messages.vue
  - 系统消息标签只显示系统通知
  - 聊天消息按物品分组显示
  - 每个聊天项显示物品名称、发布者、最新消息
- **Acceptance Criteria Addressed**: 消息按类型正确筛选, 消息列表展示物品信息
- **Notes**: 需要重新设计列表项UI

## [x] 任务8: 前端聊天页面修改
- **Priority**: P0
- **Depends On**: 任务6
- **Description**: 
  - 修改 frontend/src/pages/chat/chat.vue
  - 支持从 URL 参数获取 itemId
  - 页面顶部显示物品信息（名称、图片）
  - 发送消息时携带 itemId
- **Acceptance Criteria Addressed**: 以物品为中心的聊天
- **Notes**: 从物品详情页跳转时传入 itemId

## [x] 任务9: 前端物品详情页跳转
- **Priority**: P1
- **Depends On**: 任务8
- **Description**: 
  - 修改物品详情页的"联系发布者"按钮
  - 跳转到聊天页面时携带 itemId 参数
  - 确保创建的是该物品的独立聊天
- **Acceptance Criteria Addressed**: 以物品为中心的聊天
- **Notes**: 检查所有跳转到聊天页面的入口

## [x] 任务10: 数据迁移和测试
- **Priority**: P1
- **Depends On**: 任务1-9
- **Description**: 
  - 清空 user 和 user1 的现有消息数据
  - 测试新功能完整流程
  - 验证消息按物品正确分组
- **Acceptance Criteria Addressed**: 清空用户对话记录
- **Notes**: 需要备份数据

# Task Dependencies
- 任务2, 任务3, 任务4 依赖 任务1
- 任务6 依赖 任务2, 任务3, 任务4
- 任务7, 任务8 依赖 任务6
- 任务9 依赖 任务8
- 任务10 依赖 任务1-9
