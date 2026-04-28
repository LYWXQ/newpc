# 首页搜索和学生认证功能 - Product Requirement Document

## Overview

* **Summary**: 完善校园闲置共享平台，添加首页搜索功能和学生认证功能，提升用户体验和平台可信度。

* **Purpose**: 让用户能够方便地搜索物品，同时通过学生认证机制增强平台的可信度和安全性。

* **Target Users**: 所有使用校园闲置共享平台的学生用户。

## Goals

* 实现首页搜索功能，用户可以输入关键词搜索物品

* 实现学生认证功能，包括注册时填写学校和专业信息

* 在个人中心显示认证状态，未认证用户可以进行认证

* 数据库设计支持学生认证相关字段

* 搜索功能对接前后端API

## Non-Goals (Out of Scope)

* 实现真实的学信网认证API对接（如果无公开API，暂时搁置）

* 实现复杂的审核流程

* 实现认证奖励机制

## Background & Context

当前项目已有：

* 物品列表API（后端已支持keyword参数，但首页搜索框目前仅跳转搜索页）

* User模型已有isVerified字段

* 注册页面、个人中心页面已存在

* 前端已有search页面

## Functional Requirements

* **FR-1**: 首页搜索功能 - 用户可以在首页直接输入关键词搜索物品，无需跳转到搜索页面

* **FR-2**: 学生认证状态显示 - 在个人中心信用分旁显示认证状态标签

* **FR-3**: 注册页面学校和专业输入 - 注册时可以选择学校（带搜索和下拉选择）和输入专业

* **FR-4**: 数据库字段扩展 - User模型添加school和major字段

* **FR-5**: 个人中心展示学校信息 - 若用户填写了学校信息，在个人中心展示

* **FR-6**: 认证入口 - 未认证用户点击认证状态可以前往认证（暂留接口）

## Non-Functional Requirements

* **NFR-1**: 学校搜索防抖 - 学校搜索输入框设置300ms防抖，避免频繁请求

* **NFR-2**: 搜索响应时间 - 物品搜索API响应时间应小于1秒

* **NFR-3**: 用户体验 - 界面交互流畅，无明显卡顿

## Constraints

* **Technical**: 使用现有的技术栈（Uni-app + Vue 3 + Node.js + Express + Sequelize）

* **Business**: 无学信网认证API可用，认证功能暂时只记录信息，不做真实验证

* **Dependencies**: 依赖现有的用户认证系统和物品API

## Assumptions

* 学校数据使用预定义的高校列表（内置在前端）

* 用户注册时填写的学校信息仅供展示，不影响认证状态

* 认证状态默认未认证，需手动或通过其他方式更新

## Acceptance Criteria

### AC-1: 首页搜索功能

* **Given**: 用户在首页

* **When**: 用户在搜索框输入关键词并点击搜索/按回车

* **Then**: 页面显示搜索结果，无需跳转到搜索页面

* **Verification**: `human-judgment`

### AC-2: 学生认证状态显示

* **Given**: 用户在个人中心

* **When**: 用户查看个人信息

* **Then**: 信用分旁显示认证状态标签（已认证/未认证）

* **Verification**: `human-judgment`

### AC-3: 注册页面学校输入

* **Given**: 用户在注册页面

* **When**: 用户输入学校关键词

* **Then**: 下拉菜单显示匹配的高校列表，300ms防抖

* **Verification**: `human-judgment`

### AC-4: 数据库字段

* **Given**: User模型

* **When**: 查看数据库结构

* **Then**: User表包含school和major字段

* **Verification**: `programmatic`

### AC-5: 个人中心展示学校信息

* **Given**: 用户已填写学校信息

* **When**: 用户查看个人中心

* **Then**: 个人中心显示学校和专业信息（如果填写了）

* **Verification**: `human-judgment`

### AC-6: 项目启动无错误

* **Given**: 完成功能开发

* **When**: 启动数据库和前后端项目

* **Then**: 项目正常启动，无控制台错误

* **Verification**: `programmatic`

## Open Questions

* [ ] 是否需要创建认证申请页面？

* [ ] 学校列表是否需要支持自定义添加？

* [ ] 认证状态是否需要管理员审核？

