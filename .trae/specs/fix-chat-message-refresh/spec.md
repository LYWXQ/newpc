# 聊天消息发送后刷新问题修复

## Why
当前聊天功能在发送消息后，消息列表没有正确刷新显示新消息，输入框也没有清空。这导致用户体验不佳，无法确认消息是否发送成功。

## What Changes
- 修复消息发送后列表不刷新问题
- 确保输入框在发送后正确清空
- 优化消息添加的响应式更新逻辑

## Impact
- Affected files:
  - `frontend/src/pages/chat/chat.vue` - 聊天页面消息处理逻辑
- Affected functionality: 消息发送后的UI更新

## ADDED Requirements

### Requirement: 消息发送后UI更新
系统 SHALL 在消息发送成功后立即更新UI。

#### Scenario: 发送消息后列表刷新
- **GIVEN** 用户在聊天页面输入消息并点击发送
- **WHEN** 消息成功发送到后端
- **THEN** 消息 SHALL 立即显示在聊天列表中
- **AND** 输入框 SHALL 被清空
- **AND** 聊天界面 SHALL 滚动到最新消息

## Acceptance Criteria

### AC-1: 消息发送后正确显示
- **Given**: 用户在聊天页面
- **When**: 发送一条消息
- **Then**: 消息立即显示在聊天列表中
- **Verification**: `human-judgment`

### AC-2: 输入框发送后清空
- **Given**: 用户在聊天页面输入了消息
- **When**: 点击发送按钮
- **Then**: 输入框内容被清空
- **Verification**: `human-judgment`
