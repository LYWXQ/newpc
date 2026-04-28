# 发布界面优化 - Product Requirement Document

## Overview
- **Summary**: 优化物品发布界面，支持三种交易方式（免费、租用、转卖），不同方式显示不同表单内容；优化租用表单的可租时间，支持长期租用（不设结束时间）。
- **Purpose**: 提供更灵活的物品发布体验，满足用户多样化的交易需求；简化长期租用的设置流程。
- **Target Users**: 校园闲置物品共享平台的物品发布者

## Goals
- 添加交易方式选择（免费、租用、转卖）
- 根据交易方式动态显示/隐藏表单字段
- 优化可租时间选择，支持长期租用（无结束时间）
- 更新数据模型和API以支持新功能
- 保持向后兼容，现有租用功能不受影响

## Non-Goals (Out of Scope)
- 不修改物品详情页的展示逻辑
- 不修改搜索和筛选功能
- 不修改订单系统的核心逻辑
- 不添加支付功能

## Background & Context
- 当前发布界面仅支持租用模式，表单固定显示租金、押金、可租时间
- 数据库Item模型已存在，使用Sequelize ORM
- 前端使用Vue 3 + uni-app框架
- 后端使用Node.js + Express + MySQL

## Functional Requirements
- **FR-1**: 用户可选择交易方式（免费、租用、转卖）
- **FR-2**: 选择免费时，隐藏租金、押金、可租时间字段
- **FR-3**: 选择租用（默认）时，显示完整表单（当前行为）
- **FR-4**: 选择转卖时，显示售价钱段，隐藏押金和可租时间
- **FR-5**: 租用模式下支持"长期租用"开关，开启时隐藏结束时间
- **FR-6**: 数据模型支持新字段（transactionType、salePrice）
- **FR-7**: 后端API支持创建和更新带新字段的物品
- **FR-8**: 编辑模式下正确回显交易方式和相关字段

## Non-Functional Requirements
- **NFR-1**: 表单切换流畅无卡顿
- **NFR-2**: 保持现有表单验证逻辑
- **NFR-3**: 代码风格与现有代码保持一致
- **NFR-4**: 向后兼容，现有物品数据不受影响

## Constraints
- **Technical**: 前端使用Vue 3 + uni-app，后端使用Node.js + Express + MySQL + Sequelize
- **Business**: 保持现有API接口的向后兼容性
- **Dependencies**: 无外部依赖，使用现有技术栈

## Assumptions
- 免费物品不需要押金
- 转卖物品不需要押金
- 长期租用通过不设置结束时间来表示
- 现有物品默认交易方式为"rent"（租用）

## Acceptance Criteria

### AC-1: 交易方式选择
- **Given**: 用户在发布界面
- **When**: 用户查看表单顶部
- **Then**: 显示三个单选按钮：免费、租用（默认选中）、转卖
- **Verification**: `human-judgment`

### AC-2: 免费模式表单
- **Given**: 用户选择"免费"交易方式
- **When**: 表单刷新
- **Then**: 只显示：标题、分类、描述、位置、图片；隐藏租金、押金、可租时间
- **Verification**: `human-judgment`

### AC-3: 租用模式表单（默认）
- **Given**: 用户选择"租用"交易方式
- **When**: 表单刷新
- **Then**: 显示完整表单：标题、分类、描述、租金、押金、可租时间、位置、图片
- **Verification**: `human-judgment`

### AC-4: 转卖模式表单
- **Given**: 用户选择"转卖"交易方式
- **When**: 表单刷新
- **Then**: 显示：标题、分类、描述、售价、位置、图片；隐藏押金和可租时间
- **Verification**: `human-judgment`

### AC-5: 长期租用开关
- **Given**: 用户在租用模式下
- **When**: 用户开启"长期租用"开关
- **Then**: 结束时间选择区域被隐藏
- **Verification**: `human-judgment`

### AC-6: 长期租用关闭
- **Given**: "长期租用"开关已开启
- **When**: 用户关闭开关
- **Then**: 结束时间选择区域重新显示
- **Verification**: `human-judgment`

### AC-7: 数据模型更新
- **Given**: 数据库迁移已执行
- **When**: 检查Item表结构
- **Then**: 包含transactionType和salePrice字段
- **Verification**: `programmatic`

### AC-8: 创建物品API
- **Given**: 后端服务运行中
- **When**: 发送POST /api/items，包含transactionType和salePrice
- **Then**: 物品成功创建，新字段正确保存
- **Verification**: `programmatic`

### AC-9: 更新物品API
- **Given**: 物品已存在
- **When**: 发送PUT /api/items/:id，更新transactionType
- **Then**: 物品成功更新
- **Verification**: `programmatic`

### AC-10: 编辑模式回显
- **Given**: 用户编辑一个现有物品
- **When**: 页面加载
- **Then**: 正确显示物品的交易方式和对应表单字段
- **Verification**: `human-judgment`

## Open Questions
- 无
