# 登录问题诊断与修复 Spec

## Why
用户报告登录异常，症状表现为：登录一段时间后重新运行项目会无法登录，数据库似乎没有用户数据。在创建用户后又能使用了，但一段时间后问题又会再次出现。这表明存在数据库连接或数据持久化的问题。

## What Changes
- 诊断数据库连接配置问题
- 检查 MySQL 数据库中用户数据的实际状态
- 验证数据库连接池配置是否正确
- 检查是否有数据被意外删除或数据库表结构异常
- 修复 `username` 和 `role` 字段的兼容性问题（已在之前的修改中临时修复）

## Impact
- Affected specs: 现有的 `token-expiration-fix` 规格需要与本次诊断结果保持一致
- Affected code:
  - `backend/models/User.js` - 用户模型定义
  - `backend/config/database.js` - 数据库连接配置
  - `backend/app.js` - 数据库初始化逻辑
  - `frontend/src/utils/request.ts` - 前端请求处理

## ADDED Requirements
### Requirement: 数据库连接稳定性
系统 SHALL 确保数据库连接稳定，避免连接断开导致的数据访问异常。

#### Scenario: 数据库连接异常
- **WHEN** 数据库连接断开或超时
- **THEN** 系统应记录错误日志并尝试重新连接

### Requirement: 用户数据持久化
系统 SHALL 确保用户数据正确持久化到数据库，不会因应用重启而丢失。

#### Scenario: 应用重启后用户数据存在
- **WHEN** 应用重启后用户尝试登录
- **THEN** 数据库中应存在该用户的数据，登录应成功

## MODIFIED Requirements
### Requirement: 现有 Token 过期处理（已实现）
现有的 token 过期处理逻辑应保持正常工作：
- 当收到 403 状态码时，清除本地存储的 token 和用户信息
- 引导用户到登录页面重新登录

## REMOVED Requirements
无

## 诊断步骤
1. 检查 MySQL 服务状态和数据库连接配置
2. 验证 users 表中的数据完整性
3. 检查 `username` 字段是否允许 NULL（之前修改的临时修复）
4. 检查 `role` 字段类型是否与现有数据兼容
5. 分析数据库连接池配置是否合理
6. 检查是否有定期清理数据库的脚本或逻辑
