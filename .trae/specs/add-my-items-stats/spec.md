# 添加"我发布的"统计功能 - 产品需求文档

## Overview
- **Summary**: 在用户个人中心页面添加"我发布的"统计项，显示当前用户发布的物品总数，点击后可跳转到"我的发布"页面
- **Purpose**: 让用户能够快速查看自己发布的物品数量，并方便地跳转到发布列表页面进行管理
- **Target Users**: 已登录的应用用户

## Goals
- 在个人中心统计区添加"我发布的"统计项
- 显示当前用户发布的物品总数量
- 点击统计项跳转到"我的发布"页面
- 保持与现有统计项一致的UI风格

## Non-Goals (Out of Scope)
- 不修改"我的发布"页面的现有功能
- 不添加新的后端API（复用现有接口）
- 不添加统计数据的筛选功能

## Background & Context
- 个人中心页面（profile.vue）已有4个统计项：我借出的、我借入的、待处理、未读消息
- "我的发布"页面（my-items.vue）已存在，用于管理用户发布的物品
- 后端已有获取用户物品列表的接口 `/api/items/mine`，可用于获取总数
- 需要将统计项从4个调整为5个

## Functional Requirements
- **FR-1**: 在个人中心统计区添加"我发布的"统计项
- **FR-2**: 统计项显示当前用户发布的物品总数量
- **FR-3**: 点击"我发布的"统计项跳转到"我的发布"页面
- **FR-4**: 未登录用户统计数量显示为0，点击提示登录

## Non-Functional Requirements
- **NFR-1**: 统计数据应在页面加载时和显示时自动更新
- **NFR-2**: UI风格与现有统计项保持一致
- **NFR-3**: 跳转响应时间应在100ms以内

## Constraints
- **Technical**: 使用现有的 Vue 3 + Composition API 技术栈
- **Business**: 不引入新的后端API
- **Dependencies**: 依赖现有的 `/api/items/mine` 接口

## Assumptions
- 用户已登录时调用后端接口获取数据
- 未登录时统计数量默认为0
- 点击未登录状态时，先提示登录再跳转（如果需要）

## Acceptance Criteria

### AC-1: 统计项显示
- **Given**: 用户打开个人中心页面
- **When**: 页面加载完成
- **Then**: 统计区显示5个统计项，新增"我发布的"项
- **Verification**: `human-judgment`
- **Notes**: 检查UI布局是否正确，样式是否一致

### AC-2: 统计数量显示（已登录）
- **Given**: 用户已登录并发布过物品
- **When**: 个人中心页面加载完成
- **Then**: "我发布的"统计项显示正确的物品数量
- **Verification**: `programmatic`
- **Notes**: 验证数量与"我的发布"页面中的总数一致

### AC-3: 统计数量显示（未登录）
- **Given**: 用户未登录
- **When**: 个人中心页面加载完成
- **Then**: "我发布的"统计项显示0
- **Verification**: `programmatic`

### AC-4: 点击跳转到我的发布
- **Given**: 用户已登录
- **When**: 点击"我发布的"统计项
- **Then**: 成功跳转到"我的发布"页面
- **Verification**: `programmatic`

### AC-5: 未登录点击提示
- **Given**: 用户未登录
- **When**: 点击"我发布的"统计项
- **Then**: 先跳转到登录页面
- **Verification**: `programmatic`

## Open Questions
- [ ] 无已知问题
