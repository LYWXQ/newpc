# 优化交易方式和首页筛选 - Product Requirement Document

## Overview
- **Summary**: 优化发布页面的交易方式选择，同时在首页添加交易类型筛选功能，包括全部、免费、可租、购买四个标签。
- **Purpose**: 改善用户发布物品的体验，同时让用户能够更方便地按交易类型筛选物品。
- **Target Users**: 发布物品的用户和浏览物品的用户

## Goals
- 移除发布页面交易方式的单选框，改为标签选择
- 将"位置"标签改为"交易地点"
- 在首页添加交易类型筛选标签（全部、免费、可租、购买）
- 修复首页加载异常问题
- 确保筛选功能正常工作，展示同时满足两类筛选的内容

## Non-Goals (Out of Scope)
- 修改物品的其他发布字段
- 修改后端数据库结构
- 添加新的交易类型

## Background & Context
当前发布页面使用单选框选择交易方式，首页缺少按交易类型筛选的功能。需要优化这两个部分，提升用户体验。

## Functional Requirements
- **FR-1**: 发布页面交易方式改为标签选择（非单选框）
- **FR-2**: 发布页面"位置"标签改为"交易地点"
- **FR-3**: 首页添加交易类型筛选标签（全部、免费、可租、购买）
- **FR-4**: 首页分类筛选和交易类型筛选可以同时生效
- **FR-5**: 修复首页加载异常问题

## Non-Functional Requirements
- **NFR-1**: 界面保持简洁美观
- **NFR-2**: 筛选操作流畅响应
- **NFR-3**: 错误提示清晰明确

## Constraints
- **Technical**: 使用 Vue 3 + uni-app 框架
- **Business**: 保持与现有风格一致
- **Dependencies**: 需要后端 API 支持 transactionType 参数

## Assumptions
- 后端已支持 transactionType 查询参数
- 首页原有分类筛选功能保持不变

## Acceptance Criteria

### AC-1: 发布页面交易方式改为标签选择
- **Given**: 用户打开发布页面
- **When**: 查看交易方式选择区域
- **Then**: 显示标签选择而非单选框
- **Verification**: `human-judgment`

### AC-2: "位置"标签改为"交易地点"
- **Given**: 用户打开发布页面
- **When**: 查看位置输入框的标签
- **Then**: 标签显示为"交易地点"
- **Verification**: `human-judgment`

### AC-3: 首页添加交易类型筛选标签
- **Given**: 用户打开首页
- **When**: 查看筛选区域
- **Then**: 显示全部、免费、可租、购买四个筛选标签
- **Verification**: `human-judgment`

### AC-4: 两类筛选同时生效
- **Given**: 用户已选择分类和交易类型
- **When**: 查看物品列表
- **Then**: 显示同时满足两个筛选条件的物品
- **Verification**: `programmatic`

### AC-5: 首页正常加载
- **Given**: 用户打开首页
- **When**: 页面加载完成
- **Then**: 物品列表正常显示，无加载异常
- **Verification**: `programmatic`

## Open Questions
- 无
