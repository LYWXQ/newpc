# 优化发布功能时间选择器 - Product Requirement Document

## Overview
- **Summary**: 优化发布物品页面的可租时间选择器，支持具体到几点几分的时间选择，默认开始时间为今天，并且不允许选择过去的日期时间。
- **Purpose**: 提供更精确的可租时间控制，提升用户体验，避免选择不合理的过去时间。
- **Target Users**: 发布闲置物品的用户

## Goals
- 支持选择具体的日期和时间（几点几分）
- 开始时间默认设置为今天（当前日期）
- 不允许选择过去的日期时间
- 保持良好的用户体验和界面设计

## Non-Goals (Out of Scope)
- 修改租金和押金的计算逻辑
- 添加复杂的时间验证规则
- 修改其他表单字段

## Background & Context
当前发布页面只支持选择日期，不支持选择具体时间，且没有默认值和时间限制。用户需要更精确的时间控制来设置物品的可租时间段。

## Functional Requirements
- **FR-1**: 时间选择器支持日期和时间（几点几分）的选择
- **FR-2**: 开始时间默认设置为今天（当前日期）
- **FR-3**: 不允许选择过去的日期时间（开始和结束时间都必须 >= 当前时间）
- **FR-4**: 结束时间必须晚于开始时间

## Non-Functional Requirements
- **NFR-1**: 界面保持简洁易用
- **NFR-2**: 时间选择操作流畅
- **NFR-3**: 错误提示清晰明确

## Constraints
- **Technical**: 使用 uni-app 框架的 picker 组件
- **Business**: 保持与现有表单风格一致
- **Dependencies**: 依赖 uni-app 的 picker 组件

## Assumptions
- 用户的设备时间设置正确
- uni-app 的 picker 组件能够满足需求

## Acceptance Criteria

### AC-1: 时间选择器支持日期和时间
- **Given**: 用户打开发布页面
- **When**: 用户点击可租时间选择器
- **Then**: 可以选择具体的日期和时间（几点几分）
- **Verification**: `human-judgment`

### AC-2: 开始时间默认设置为今天
- **Given**: 用户首次打开发布页面（非编辑模式）
- **When**: 查看可租时间字段
- **Then**: 开始时间默认显示为今天的日期
- **Verification**: `programmatic`

### AC-3: 不允许选择过去的时间
- **Given**: 用户正在选择可租时间
- **When**: 用户尝试选择过去的日期时间
- **Then**: 系统阻止选择或提示错误
- **Verification**: `programmatic`

### AC-4: 结束时间必须晚于开始时间
- **Given**: 用户已选择开始时间
- **When**: 用户选择结束时间
- **Then**: 结束时间必须晚于开始时间，否则提示错误
- **Verification**: `programmatic`

## Open Questions
- 无
