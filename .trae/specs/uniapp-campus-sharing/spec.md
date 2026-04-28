# 校园闲置物品共享平台 - 完善功能规格文档

## Overview
- **Summary**: 校园闲置物品共享平台是一个基于Uniapp开发的移动端应用，旨在解决校园场景下闲置资源利用率低、共享信任缺失、供需匹配低效等问题。
- **Purpose**: 完善现有功能，实现前后端完整对接，提升用户体验和系统稳定性。
- **Target Users**: 在校学生（发布者和租用者）、平台管理员

## Goals
- 完成前后端 API 对接，替换所有模拟数据
- 完善用户认证流程（注册、登录、JWT）
- 实现完整的物品管理功能（发布、编辑、删除、搜索）
- 完成订单全流程管理（申请、审批、状态跟踪）
- 实现消息通知和聊天功能
- 完善评价系统
- 优化 UI 界面和交互体验

## Non-Goals (Out of Scope)
- 真实在线支付功能（保持模拟）
- PC 端适配
- 第三方社交登录
- 实际物流跟踪

## Current Status
- ✅ 项目基础结构搭建完成
- ✅ 后端 API 框架和数据库模型完成
- ✅ 前端页面框架完成
- ⚠️ 前端使用模拟数据，需要对接真实 API
- ⚠️ 部分功能需要完善

## ADDED Requirements

### Requirement: 前后端 API 对接
系统 SHALL 完成所有前端页面与后端 API 的对接。

#### Scenario: 用户认证对接
- **WHEN** 用户在前端进行注册/登录操作
- **THEN** 系统调用后端 API 进行身份验证
- **AND** 返回 JWT token 用于后续请求认证

#### Scenario: 物品数据对接
- **WHEN** 用户浏览物品列表/详情
- **THEN** 系统从后端 API 获取真实数据
- **AND** 支持分页、筛选、排序功能

#### Scenario: 订单数据对接
- **WHEN** 用户进行订单相关操作
- **THEN** 系统调用后端 API 处理订单逻辑
- **AND** 实时同步订单状态

### Requirement: 图片上传功能
系统 SHALL 实现图片上传功能，支持物品图片和用户头像上传。

#### Scenario: 物品图片上传
- **WHEN** 用户发布物品时上传图片
- **THEN** 系统 SHALL 支持多图上传
- **AND** 图片 SHALL 存储在服务器本地或云存储

### Requirement: 消息通知系统
系统 SHALL 实现消息通知功能，包括系统通知和聊天消息。

#### Scenario: 系统通知
- **WHEN** 订单状态变更或有新消息时
- **THEN** 系统 SHALL 发送通知给用户
- **AND** 消息中心 SHALL 显示未读消息数

### Requirement: 智能推荐优化
系统 SHALL 优化推荐算法，提供个性化物品推荐。

#### Scenario: 热门推荐
- **WHEN** 用户访问首页
- **THEN** 系统 SHALL 基于浏览量和租借量推荐热门物品

## MODIFIED Requirements

### Requirement: 用户认证模块
**原有**: 模拟登录功能
**修改**: 对接后端真实 API，实现完整的注册/登录流程

### Requirement: 物品管理模块
**原有**: 使用模拟数据展示物品
**修改**: 
- 对接后端物品 API
- 实现真实的数据分页和筛选
- 支持图片上传和展示

### Requirement: 订单管理模块
**原有**: 基础页面结构
**修改**:
- 对接后端订单 API
- 实现完整的订单状态流转
- 集成押金计算逻辑

## Impact
- **Affected Frontend Pages**: 
  - pages/index/index.vue - 需要对接推荐和最新物品 API
  - pages/login/login.vue - 需要对接真实登录 API
  - pages/register/register.vue - 需要对接真实注册 API
  - pages/items/items.vue - 需要对接物品列表 API
  - pages/item-detail/item-detail.vue - 需要对接物品详情 API
  - pages/publish/publish.vue - 需要对接发布物品 API
  - pages/orders/orders.vue - 需要对接订单列表 API
  - pages/order-detail/order-detail.vue - 需要对接订单详情 API
  - pages/messages/messages.vue - 需要对接消息 API
  - pages/profile/profile.vue - 需要对接用户信息 API
- **Affected Backend APIs**: 所有现有 API 需要测试和完善
- **New Components**: 图片上传组件、消息通知组件

## Acceptance Criteria

### AC-1: API 对接完成
- **Given**: 前端页面使用模拟数据
- **When**: 完成 API 对接后
- **Then**: 所有数据从后端 API 获取，功能正常
- **Verification**: `programmatic`

### AC-2: 图片上传功能
- **Given**: 用户发布物品或修改头像
- **When**: 用户选择图片上传
- **Then**: 图片成功上传并正确显示
- **Verification**: `human-judgment`

### AC-3: 消息通知功能
- **Given**: 系统有新消息
- **When**: 用户查看消息中心
- **Then**: 消息列表显示正确，未读消息标记准确
- **Verification**: `human-judgment`

### AC-4: 订单流程完整
- **Given**: 用户提交借用申请
- **When**: 订单状态流转
- **Then**: 订单状态更新正确，双方收到通知
- **Verification**: `programmatic`

### AC-5: 界面优化
- **Given**: 现有界面需要优化
- **When**: 完成 UI 优化后
- **Then**: 界面美观，操作流畅，用户体验良好
- **Verification**: `human-judgment`
