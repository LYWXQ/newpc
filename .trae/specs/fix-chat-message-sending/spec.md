# 聊天功能消息发送问题修复

## Why
当前聊天功能无法发送消息，原因是前后端数据结构不匹配，导致消息发送失败。

## What Changes
- 修复消息 API 调用的字段名称不匹配问题
- 统一消息类型的字段定义
- 确保发送消息功能正常工作

## Impact
- Affected files:
  - `frontend/src/api/messages.ts` - 消息 API 接口定义
  - `frontend/src/pages/chat/chat.vue` - 聊天页面消息处理
- Affected APIs: 消息发送 API

## ADDED Requirements

### Requirement: 消息发送功能修复
系统 SHALL 能够正常发送聊天消息。

#### Scenario: 发送消息成功
- **GIVEN** 用户在聊天页面输入消息内容
- **WHEN** 用户点击发送按钮
- **THEN** 消息 SHALL 成功发送到后端
- **AND** 消息 SHALL 显示在聊天列表中
- **AND** 输入框 SHALL 清空

## MODIFIED Requirements

### Requirement: 消息 API 接口
**原有**: 发送消息返回字段名称与期望不匹配
**修改**: 统一前后端数据结构，确保字段名称一致

## Acceptance Criteria

### AC-1: 消息发送功能正常
- **Given**: 用户进入聊天页面
- **When**: 发送一条消息
- **Then**: 消息成功发送并显示在界面上
- **Verification**: `human-judgment`
