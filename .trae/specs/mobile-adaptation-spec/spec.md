# UniApp 移动端适配规范 - 产品需求文档

## Overview
- **Summary**: 对 UniApp 前端项目进行全面的移动端适配优化，重点解决滚动问题和安全区域适配
- **Purpose**: 确保应用在各种移动端设备上都能正确显示和流畅滚动
- **Target Users**: 所有移动端用户（iOS、Android）

## Goals
- 修复所有页面的滚动问题
- 实现完整的安全区域适配（刘海屏、底部横条）
- 统一滚动行为和交互体验
- 优化自定义导航栏的动态高度计算

## Non-Goals (Out of Scope)
- 不涉及业务逻辑修改
- 不添加新功能
- 不修改后端接口

## Background & Context
当前项目存在以下移动端适配问题：
1. 部分页面 scroll-view 缺少高度设置，导致滚动异常
2. 自定义导航栏页面未动态计算状态栏高度
3. 底部安全区域适配不完整
4. 滚动行为不一致

## Functional Requirements
- **FR-1**: 所有页面滚动正常，无卡顿或滚动失效
- **FR-2**: iOS 刘海屏设备导航栏正确显示
- **FR-3**: iOS 底部横条不遮挡内容
- **FR-4**: 自定义导航栏高度动态计算

## Non-Functional Requirements
- **NFR-1**: 滚动流畅，无卡顿
- **NFR-2**: 适配各种屏幕尺寸（320px - 414px 宽度）
- **NFR-3**: 适配 iOS 11+ 和 Android 5.0+

## Constraints
- **Technical**: UniApp 框架限制，微信小程序环境
- **Dependencies**: 已有设备信息工具函数

## Assumptions
- 所有页面使用 rpx 响应式单位
- 已有 `src/utils/device.ts` 设备工具函数

## Acceptance Criteria

### AC-1: 首页滚动正常
- **Given**: 用户在首页
- **When**: 上下滚动页面
- **Then**: 页面流畅滚动，内容完整显示
- **Verification**: `human-judgment`

### AC-2: 聊天页面自动滚动到底部
- **Given**: 用户发送消息
- **When**: 消息发送成功
- **Then**: 页面自动滚动到底部显示最新消息
- **Verification**: `human-judgment`

### AC-3: iOS 刘海屏适配
- **Given**: 使用 iPhone X 及以上设备
- **When**: 打开首页或 admin 页面
- **Then**: 自定义导航栏正确显示，不被刘海遮挡
- **Verification**: `human-judgment`

### AC-4: 底部安全区域适配
- **Given**: 使用 iPhone X 及以上设备
- **When**: 打开任意页面
- **Then**: 底部内容不被底部横条遮挡
- **Verification**: `human-judgment`

### AC-5: 订单列表滚动正常
- **Given**: 用户在订单页面
- **When**: 上下滚动订单列表
- **Then**: 列表流畅滚动，支持下拉刷新和上拉加载
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要支持横屏模式？
- [ ] 是否需要适配 iPad 设备？