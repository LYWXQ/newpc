# 收藏功能 Spec

## Why
用户需要能够收藏感兴趣的物品，方便后续查看和联系发布者。同时需要在个人中心提供收藏管理入口，支持查看收藏列表和批量取消收藏。

## What Changes
- **BREAKING**: 新增收藏数据模型和数据库表
- 修改物品详情页底部按钮：收藏按钮（已收藏时显示"取消收藏"）+ 联系发布者按钮
- 个人中心新增"我的收藏"菜单项
- 新增"我的收藏"页面，展示收藏物品列表
- 实现收藏/取消收藏功能（包括批量操作）
- 新增收藏相关的后端API接口

## Impact
- Affected specs: 物品详情页、个人中心、用户数据模型
- Affected code: 
  - Frontend: item-detail.vue, profile.vue, 新增 favorites.vue
  - Backend: 新增 Favorite 模型, 新增 favorites 路由和控制器

## ADDED Requirements

### Requirement: 收藏数据模型
The system SHALL provide a Favorite model to store user-item favorite relationships.

#### Scenario: 数据模型定义
- **GIVEN** 用户和物品已存在
- **WHEN** 创建收藏记录
- **THEN** 系统应存储用户ID、物品ID、创建时间等信息
- **AND** 应支持查询用户的所有收藏
- **AND** 应支持查询物品被收藏的次数

### Requirement: 物品详情页收藏按钮
The system SHALL display favorite and contact buttons on item detail page.

#### Scenario: 未收藏状态
- **GIVEN** 用户未收藏该物品
- **WHEN** 查看物品详情页
- **THEN** 显示"收藏"按钮（黄色/橙色背景）
- **AND** 显示"联系发布者"按钮（蓝色背景）

#### Scenario: 已收藏状态
- **GIVEN** 用户已收藏该物品
- **WHEN** 查看物品详情页
- **THEN** 显示"取消收藏"按钮（灰色背景）
- **AND** 显示"联系发布者"按钮（蓝色背景）

#### Scenario: 收藏操作
- **GIVEN** 用户点击收藏按钮
- **WHEN** 操作成功
- **THEN** 按钮变为"取消收藏"状态
- **AND** 显示收藏成功提示

### Requirement: 个人中心收藏入口
The system SHALL provide a favorites entry in user profile.

#### Scenario: 菜单展示
- **GIVEN** 用户进入个人中心
- **WHEN** 查看功能菜单
- **THEN** 在"我的评价"下方显示"我的收藏"菜单项
- **AND** 显示收藏数量徽章

### Requirement: 收藏列表页面
The system SHALL display user's favorite items in a dedicated page.

#### Scenario: 列表展示
- **GIVEN** 用户进入收藏页面
- **WHEN** 页面加载完成
- **THEN** 显示收藏物品列表
- **AND** 每个列表项显示物品图片、名称、价格
- **AND** 每个列表项右侧显示"取消收藏"按钮

#### Scenario: 点击进入详情
- **GIVEN** 用户查看收藏列表
- **WHEN** 点击某个收藏物品
- **THEN** 跳转到该物品详情页

#### Scenario: 单个取消收藏
- **GIVEN** 用户查看收藏列表
- **WHEN** 点击某物品的"取消收藏"按钮
- **THEN** 弹出确认对话框
- **AND** 确认后从列表中移除该物品

#### Scenario: 批量取消收藏
- **GIVEN** 用户查看收藏列表
- **WHEN** 点击"批量管理"按钮
- **THEN** 进入批量选择模式
- **AND** 显示复选框供用户选择
- **AND** 选择完成后点击"取消收藏"需确认
- **AND** 确认后批量移除选中的物品

### Requirement: 收藏API接口
The system SHALL provide RESTful APIs for favorite operations.

#### Scenario: 添加收藏
- **GIVEN** 用户已登录
- **WHEN** POST /api/favorites with itemId
- **THEN** 创建收藏记录
- **AND** 返回成功状态

#### Scenario: 取消收藏
- **GIVEN** 用户已登录且已收藏该物品
- **WHEN** DELETE /api/favorites/:itemId
- **THEN** 删除收藏记录
- **AND** 返回成功状态

#### Scenario: 获取收藏列表
- **GIVEN** 用户已登录
- **WHEN** GET /api/favorites
- **THEN** 返回用户的收藏列表
- **AND** 包含物品详细信息

#### Scenario: 检查收藏状态
- **GIVEN** 用户已登录
- **WHEN** GET /api/favorites/check/:itemId
- **THEN** 返回该物品是否已被收藏

#### Scenario: 批量取消收藏
- **GIVEN** 用户已登录
- **WHEN** DELETE /api/favorites/batch with itemIds array
- **THEN** 批量删除收藏记录
- **AND** 返回操作结果

## MODIFIED Requirements

### Requirement: 物品详情页按钮布局
**Current**: 联系发布者 + 立即借用
**Modified**: 收藏/取消收藏 + 联系发布者
**Reason**: 用户更倾向于先收藏再决定是否借用

## REMOVED Requirements
None
