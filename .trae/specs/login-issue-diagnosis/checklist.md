# 登录问题诊断与修复 - 验证清单

## 诊断检查项
- [x] MySQL 服务状态正常
- [x] users 表存在于数据库中
- [x] users 表中存在用户数据（3个用户）
- [x] users 表结构与 User 模型定义一致
- [x] `username` 字段允许 NULL（已修改）
- [x] `role` 字段类型为 VARCHAR(20)（已修改，兼容 superadmin 值）

## 数据库配置检查项
- [x] 数据库连接池配置合理
- [x] 已移除无效的 `collate` 配置项
- [x] 连接超时设置合理（acquire: 30000, idle: 10000）

## 功能验证检查项
- [x] 后端服务器能够正常启动
- [x] 数据库连接成功建立
- [x] 数据库模型同步成功（使用 alter: true，无数据丢失）
- [x] 登录 API 正常工作（账号 202214060422 登录成功）
- [ ] 注册 API 正常工作（需要进一步测试）
- [x] Token 生成和验证正常（JWT 格式，24h 过期时间）
- [x] 应用重启后用户数据保持完整

## 代码修复检查项
- [x] `backend/models/User.js` 中 `username` 字段设置为 `allowNull: true`
- [x] `backend/models/User.js` 中 `role` 字段类型为 `STRING(20)`
- [x] `backend/config/database.js` 中已移除无效的 `collate` 配置项
- [x] `frontend/src/utils/request.ts` 中 401/403 处理逻辑正确
