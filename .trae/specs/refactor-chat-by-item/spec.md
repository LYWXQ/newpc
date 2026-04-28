# 以物品为中心的聊天系统重构

## Why
当前聊天系统存在以下问题：
1. 消息界面分为系统消息和聊天消息，但它们现在都展示所有消息，没有正确区分
2. 聊天没有与物品关联，同一发布者的多个物品共用同一个聊天，无法区分不同物品的交易对话
3. 需要支持以物品为维度的独立对话，不同用户与同一发布者的不同物品应该创建不同的聊天会话

## What Changes
- **BREAKING**: 数据库 Message 表添加 itemId 字段，关联到物品
- **BREAKING**: 修改消息查询逻辑，按物品维度分组展示聊天列表
- 修复消息类型筛选，系统消息和聊天消息正确分离
- 消息列表展示物品名称、发布者信息和最新对话
- 聊天页面以物品为中心，展示物品信息

## Impact
- Affected specs: 消息系统、聊天系统、物品交易系统
- Affected code:
  - `backend/models/message.js` - 添加 itemId 字段
  - `backend/routes/messages.js` - 修改查询逻辑
  - `frontend/src/pages/messages/messages.vue` - 按物品分组展示
  - `frontend/src/pages/chat/chat.vue` - 展示物品信息
  - `frontend/src/api/messages.ts` - 更新 API 接口

## ADDED Requirements

### Requirement: 消息按类型正确筛选
系统 SHALL 正确区分系统消息和聊天消息。

#### Scenario: 系统消息列表
- **GIVEN** 用户在消息页面选择"系统通知"标签
- **WHEN** 加载消息列表
- **THEN** 只显示 type='system' 的消息

#### Scenario: 聊天消息列表
- **GIVEN** 用户在消息页面选择"聊天消息"标签
- **WHEN** 加载消息列表
- **THEN** 按物品分组显示聊天会话

### Requirement: 以物品为中心的聊天
系统 SHALL 支持以物品为维度的独立聊天会话。

#### Scenario: 创建物品相关聊天
- **GIVEN** 用户从物品详情页点击"联系发布者"
- **WHEN** 进入聊天页面
- **THEN** 创建与该物品关联的独立聊天会话
- **AND** 不同物品创建不同的聊天会话

#### Scenario: 不同用户的独立聊天
- **GIVEN** 用户A和用户B都与发布者的物品X有交易意向
- **WHEN** 他们分别与发布者聊天
- **THEN** 这是两个独立的聊天会话，互不干扰

### Requirement: 消息列表展示物品信息
系统 SHALL 在聊天消息列表中展示物品相关信息。

#### Scenario: 聊天列表项展示
- **GIVEN** 用户查看聊天消息列表
- **THEN** 每个聊天项显示：
  - 物品名称
  - 发布者用户名
  - 最新一条消息内容
  - 未读消息数
  - 物品封面图（如有）

### Requirement: 清空用户对话记录
系统 SHALL 支持清空指定用户的所有对话记录。

#### Scenario: 清空用户对话
- **GIVEN** 管理员需要清空用户user和user1的对话
- **WHEN** 执行清空操作
- **THEN** 删除这两个用户参与的所有消息记录

## MODIFIED Requirements

### Requirement: 消息数据模型
**原有**: Message 表只有 senderId, receiverId, content, type
**修改**: 添加 itemId 字段，关联到 Item 表

### Requirement: 获取聊天记录
**原有**: GET /messages/chat/:userId 只按用户查询
**修改**: 支持按物品查询 GET /messages/chat/:userId?itemId=xxx

### Requirement: 发送消息
**原有**: POST /messages 只需要 receiverId, content
**修改**: 可选传入 itemId，关联到特定物品

## REMOVED Requirements
无
