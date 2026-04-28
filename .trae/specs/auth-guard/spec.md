# 权限管理 - 登录控制方案

## Overview
- **Summary**: 实现完整的权限管理系统，确保用户必须登录才能进入应用的核心功能页面
- **Purpose**: 保护应用数据安全，确保只有登录用户才能访问应用功能
- **Target Users**: 所有使用校园闲置共享平台的用户

## Goals
- 实现路由级别的登录控制
- 用户未登录时自动跳转到登录页面
- 登录成功后返回到之前访问的页面
- 提供统一的权限检查机制

## Non-Goals (Out of Scope)
- 角色级别的细粒度权限控制（如管理员权限）
- 动态路由权限配置
- 权限缓存机制

## Background & Context
- 当前应用使用 uni-app 框架
- 使用 Pinia 进行状态管理
- 已有基础的登录状态管理
- 需要增强权限控制，确保必须登录才能访问应用

## Functional Requirements
- **FR-1**: 用户未登录时访问任何页面（除登录/注册外）应自动跳转至登录页面
- **FR-2**: 登录成功后应自动返回之前访问的页面
- **FR-3**: 提供全局权限检查机制
- **FR-4**: 登录状态过期时应自动清除本地存储并跳转登录页面

## Non-Functional Requirements
- **NFR-1**: 权限检查应在页面加载前完成
- **NFR-2**: 跳转应平滑，用户体验良好
- **NFR-3**: 登录状态应持久化存储

## Constraints
- **Technical**: uni-app 框架限制，无法使用 Vue Router 的全局守卫
- **Dependencies**: 依赖 Pinia store 和本地存储

## Assumptions
- 用户登录后会保存 token 和用户信息到本地存储
- 登录页面路径为 `/pages/login/login`
- 注册页面路径为 `/pages/register/register`

## Acceptance Criteria

### AC-1: 未登录用户访问首页自动跳转登录
- **Given**: 用户未登录，本地存储中没有 token
- **When**: 用户打开首页或任意需要登录的页面
- **Then**: 自动跳转到登录页面
- **Verification**: `programmatic`

### AC-2: 登录成功后返回原页面
- **Given**: 用户未登录时访问某个页面被重定向到登录
- **When**: 用户成功登录
- **Then**: 自动跳转回之前访问的页面
- **Verification**: `programmatic`

### AC-3: 登录状态过期处理
- **Given**: 用户登录状态过期（token无效或过期）
- **When**: 用户访问需要登录的页面
- **Then**: 清除本地存储并跳转登录页面
- **Verification**: `programmatic`

### AC-4: 登录/注册页面可直接访问
- **Given**: 用户未登录
- **When**: 用户直接访问登录或注册页面
- **Then**: 正常显示页面，不跳转
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要在 tabBar 页面实现权限检查？
- [ ] 是否需要在 App.vue 中实现全局检查？
