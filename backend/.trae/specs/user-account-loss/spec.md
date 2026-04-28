# 用户账户丢失问题 - 产品需求文档

## Overview
- **Summary**: 修复用户账户丢失问题，确保用户数据在服务器重启后不会被清空，同时解决登录失败的问题。
- **Purpose**: 解决用户账户丢失的根本原因，确保用户数据持久化存储，提升系统稳定性和用户体验。
- **Target Users**: 所有系统用户，特别是普通用户。

## Goals
- 修复数据库同步配置，避免每次服务器重启时清空用户数据
- 确保用户账户数据持久化存储
- 解决登录失败的问题
- 提高系统稳定性和可靠性

## Non-Goals (Out of Scope)
- 不修改现有的用户认证逻辑
- 不改变现有的API接口结构
- 不进行大规模的数据库架构调整

## Background & Context
- 系统使用MySQL数据库存储用户数据
- 后端服务每次重启时都会清空所有数据
- 用户反映创建的账户在服务器重启后丢失
- 登录失败，返回401 Unauthorized错误

## Functional Requirements
- **FR-1**: 修改数据库同步配置，移除force: true选项
- **FR-2**: 确保用户账户数据持久化存储
- **FR-3**: 修复登录失败的问题
- **FR-4**: 验证用户账户数据在服务器重启后仍然存在

## Non-Functional Requirements
- **NFR-1**: 系统稳定性：确保服务器重启后数据不丢失
- **NFR-2**: 性能：登录请求响应时间不超过1秒
- **NFR-3**: 安全性：保持现有的密码哈希处理机制

## Constraints
- **Technical**: 使用现有的MySQL数据库和Sequelize ORM
- **Business**: 最小化对现有功能的影响
- **Dependencies**: 依赖于Sequelize的数据库同步机制

## Assumptions
- MySQL数据库服务正常运行
- 数据库连接参数正确配置
- 现有的用户认证逻辑正确

## Acceptance Criteria

### AC-1: 数据库同步配置修复
- **Given**: 服务器重启
- **When**: 启动后端服务
- **Then**: 数据库表结构不会被重新创建，现有数据保持不变
- **Verification**: `programmatic`
- **Notes**: 移除force: true选项，使用alter: true或默认值

### AC-2: 用户账户数据持久化
- **Given**: 创建用户账户并重启服务器
- **When**: 查询数据库
- **Then**: 用户账户数据仍然存在
- **Verification**: `programmatic`
- **Notes**: 验证用户表中存在之前创建的用户记录

### AC-3: 登录功能正常
- **Given**: 用户账户存在且密码正确
- **When**: 发送登录请求
- **Then**: 登录成功，返回token和用户信息
- **Verification**: `programmatic`
- **Notes**: 验证登录API返回200状态码和正确的响应数据

### AC-4: 服务器重启后登录正常
- **Given**: 创建用户账户，重启服务器
- **When**: 发送登录请求
- **Then**: 登录成功，返回token和用户信息
- **Verification**: `programmatic`
- **Notes**: 验证服务器重启后用户数据仍然可用

## Open Questions
- [ ] 是否需要对现有数据进行备份和恢复？
- [ ] 是否需要调整其他数据库同步配置？