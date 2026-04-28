# 登录问题诊断与修复 - 实现计划

## Task 1: 诊断数据库状态和用户数据
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 检查 MySQL 服务状态
  - 查看 users 表中的数据记录数量
  - 检查 users 表结构是否符合当前模型定义
  - 验证 `username` 字段是否允许 NULL
  - 验证 `role` 字段类型是否为 STRING
- **Acceptance Criteria**:
  - [x] MySQL 服务正常运行
  - [x] users 表中存在用户数据（3个用户）
  - [x] users 表结构与模型定义一致（username允许NULL，role为VARCHAR）

## Task 2: 分析数据库连接配置
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 检查数据库连接池配置
  - 检查是否有过期连接被回收的问题
  - 检查连接超时设置
  - 检查 `collate` 配置警告的解决方案
- **Acceptance Criteria**:
  - [x] 数据库连接配置合理
  - [x] 已移除无效的 collate 配置项

## Task 3: 验证后端数据库同步逻辑
- **Priority**: P0
- **Depends On**: Task 1, Task 2
- **Description**:
  - 检查 `app.js` 中的数据库同步逻辑
  - 验证 `alter: true` 是否会导致数据丢失
  - 验证是否需要在生产环境使用 `sync({ force: false })`
- **Acceptance Criteria**:
  - [x] 数据库同步使用 alter: true，不会删除现有数据
  - [x] 应用重启后用户数据保持完整（3个用户仍在）

## Task 4: 测试登录功能
- **Priority**: P0
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 启动后端服务器
  - 使用测试账号登录
  - 验证登录成功后的 token 生成
  - 验证重启后登录是否正常
- **Acceptance Criteria**:
  - [x] 登录请求能够成功（账号 202214060422 登录成功）
  - [x] 返回正确的 token（JWT 格式）
  - [x] 重启后能够正常登录

## Task 5: 永久修复模型定义（如需要）
- **Priority**: P1
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 如果 `username` 仍为 NOT NULL，需要确保注册时提供有效的 username
  - 如果 `role` 仍为 ENUM，需要确保现有数据与 ENUM 值兼容
  - 或者保持当前的 STRING 类型作为长期解决方案
- **Acceptance Criteria**:
  - [x] 用户模型定义与数据库实际结构一致（username允许NULL，role为VARCHAR）
  - [x] 注册和登录功能正常工作

## Task Dependencies
- Task 2 依赖 Task 1 的结果
- Task 3 依赖 Task 1 和 Task 2 的结果
- Task 4 依赖 Task 1、Task 2 和 Task 3 的结果
- Task 5 依赖 Task 1、Task 2 和 Task 3 的结果
