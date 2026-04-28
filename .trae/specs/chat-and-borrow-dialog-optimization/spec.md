# 聊天功能与借用弹窗优化规格文档

## Why
1. 聊天功能需要实现基础对话功能，使用户能够与物品发布者进行实时沟通
2. 立即借用功能的弹窗需要优化，当前弹窗显示不完整，日期选择需要精确到时分，提升用户体验

## What Changes
- 完成聊天功能基础对话实现
- 优化立即借用弹窗，使用合适大小的自定义弹窗组件
- 日期选择器支持选择到时分（小时和分钟）
- 使用 uni-app 原生 picker 组件实现日期时间选择

## Impact
- Affected pages:
  - `pages/chat/chat.vue` - 聊天页面功能完善
  - `pages/item-detail/item-detail.vue` - 借用弹窗优化
- Affected components: 新增借用信息弹窗组件
- Affected APIs: 消息相关 API 已存在，无需修改

## ADDED Requirements

### Requirement: 聊天基础对话功能
系统 SHALL 提供基础的聊天对话功能，支持用户之间的实时消息交流。

#### Scenario: 发送消息
- **GIVEN** 用户已进入聊天页面
- **WHEN** 用户输入消息内容并点击发送
- **THEN** 消息 SHALL 发送到后端 API
- **AND** 消息 SHALL 显示在聊天界面中

#### Scenario: 接收消息
- **GIVEN** 用户正在聊天页面
- **WHEN** 收到新消息时
- **THEN** 消息 SHALL 显示在聊天列表中
- **AND** 页面 SHALL 自动滚动到最新消息

#### Scenario: 加载历史消息
- **GIVEN** 用户进入聊天页面
- **WHEN** 页面加载时
- **THEN** 系统 SHALL 加载历史聊天记录
- **AND** 支持下拉加载更多历史消息

### Requirement: 借用信息弹窗优化
系统 SHALL 提供优化的借用信息弹窗，使用自定义弹窗组件替代 uni.showModal。

#### Scenario: 打开借用弹窗
- **GIVEN** 用户在物品详情页点击"立即借用"
- **WHEN** 弹窗打开时
- **THEN** 弹窗 SHALL 显示合适的大小，内容完整可见
- **AND** 包含开始时间、结束时间选择
- **AND** 包含备注信息输入框

#### Scenario: 选择日期时间
- **GIVEN** 用户在借用弹窗中
- **WHEN** 点击时间选择区域
- **THEN** 弹出日期时间选择器
- **AND** 支持选择到具体的时分（小时:分钟）
- **AND** 使用 uni-app picker 组件实现

#### Scenario: 提交借用申请
- **GIVEN** 用户已选择借用时间
- **WHEN** 点击确认借用按钮
- **THEN** 系统 SHALL 验证时间选择
- **AND** 提交订单创建请求
- **AND** 成功后跳转到订单页面

## MODIFIED Requirements

### Requirement: 物品详情页借用流程
**原有**: 使用 uni.showModal 显示借用信息弹窗，内容显示不完整
**修改**: 
- 使用自定义弹窗组件替代 uni.showModal
- 弹窗大小适配屏幕，内容完整显示
- 日期选择支持时分选择
- 优化用户交互体验

## Acceptance Criteria

### AC-1: 聊天功能正常
- **Given**: 用户进入聊天页面
- **When**: 发送和接收消息
- **Then**: 消息正常显示，历史记录可加载
- **Verification**: `human-judgment`

### AC-2: 借用弹窗显示完整
- **Given**: 用户点击立即借用
- **When**: 弹窗打开
- **Then**: 弹窗大小合适，所有内容可见
- **Verification**: `human-judgment`

### AC-3: 日期时间选择精确到时分
- **Given**: 用户在借用弹窗中选择时间
- **When**: 打开时间选择器
- **Then**: 可选择具体的时分
- **Verification**: `human-judgment`
