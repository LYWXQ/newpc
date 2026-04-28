# 登录问题修复计划

## 1. 问题分析

### 问题1: 退出登录后未跳转到登录界面
**位置**: `frontend/src/pages/profile/profile.vue`
**原因**: `handleLogout` 函数只调用了 `authStore.logout()` 清除状态，但没有跳转到登录页面。

### 问题2: 检查数据库用户表
**目的**: 查看数据库中用户表的结构和数据，确认用户数据是否正确保存。

## 2. 修复方案

### 修复退出登录跳转问题
修改 `handleLogout` 函数，在清除登录状态后跳转到登录页面。

### 检查数据库用户表
通过 SQL 查询查看用户表结构和数据。

## 3. 修改的文件

### 文件1: `frontend/src/pages/profile/profile.vue`
- 修改 `handleLogout` 函数，添加页面跳转逻辑

### 文件2: 数据库检查 (MySQL)
- 查询用户表结构: `DESCRIBE users;`
- 查询用户数据: `SELECT * FROM users;`

## 4. 修复步骤

### 步骤1: 修改退出登录逻辑
- 在 `handleLogout` 函数中添加 `uni.reLaunch({ url: '/pages/login/login' })`

### 步骤2: 检查数据库用户表
- 连接 MySQL 数据库
- 查询用户表结构和数据

## 5. 风险处理

- 页面跳转使用 `reLaunch` 确保关闭所有页面后跳转
- 数据库查询需要确认数据库连接正常

## 6. 验证方法

- 测试退出登录功能，确认能正确跳转到登录页面
- 验证数据库用户表数据正确
