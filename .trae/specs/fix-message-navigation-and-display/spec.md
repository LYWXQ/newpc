# 修复消息导航和显示问题 Spec

## Why
用户从个人中心点击"我的消息"时，页面跳转报错（navigateTo:fail can not navigateTo a tabbar page），且消息中心页面显示空白但个人中心显示有未读消息。

## What Changes
- 修复个人中心到消息页面的跳转方式（navigateTo → switchTab）
- 修复消息中心页面 scroll-view 相关错误（scrollTop null 问题）
- 修复消息中心 switchType 函数未定义错误
- 确保消息数据正确加载和显示

## Impact
- Affected specs: 个人中心导航、消息中心页面
- Affected code: 
  - Frontend: profile.vue, messages.vue

## ADDED Requirements

### Requirement: 修复消息页面跳转
The system SHALL use correct navigation method for tabbar pages.

#### Scenario: 从个人中心跳转到消息页面
- **GIVEN** 用户在个人中心页面
- **WHEN** 点击"我的消息"
- **THEN** 使用 switchTab 跳转到消息页面（因为消息页面是 tabbar 页面）

### Requirement: 修复消息中心页面错误
The system SHALL handle scroll-view and function errors properly.

#### Scenario: 消息页面加载
- **GIVEN** 用户进入消息中心页面
- **WHEN** 页面加载完成
- **THEN** 不报错，正常显示消息列表
- **AND** scroll-view 正常工作
- **AND** switchType 函数可用

### Requirement: 消息数据正确显示
The system SHALL display unread message count correctly.

#### Scenario: 显示未读消息
- **GIVEN** 用户有未读消息
- **WHEN** 查看消息中心
- **THEN** 正确显示未读消息列表
- **AND** 个人中心的未读消息数量与消息中心一致

## MODIFIED Requirements
None

## REMOVED Requirements
None
