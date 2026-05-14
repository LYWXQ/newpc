# 项目说明

## 技能库
- 本项目保留原始技能库：`.trae/skills/`
- 本项目同时提供 Claude Code 标准技能目录：`.claude/skills/`
- 旧的 `frontend-project`、`backend-project` 及数据库导向技能已移除，后续应以当前代码实际内容为准读取与分析
- 可按需使用仍然有效的通用技能辅助开发与验证，例如：`frontend-tester`、`uniapp`、`vue-best-practices`

## 项目结构
- `frontend/`：uni-app + Vue 3 + Vite 前端
- `backend/`：Express + Sequelize + MySQL 后端

## 启动方式
- 前端：在 `frontend/` 下运行 `npm run dev:h5`
- 前端类型检查：在 `frontend/` 下运行 `npm run type-check`
- 后端：在 `backend/` 下运行 `npm run dev`

## 图片上传约定
- 物品图片上传接口：`POST /api/upload`
- 头像文件上传接口：`POST /api/upload/avatar`
- 用户头像保存接口：`POST /api/users/avatar`
- 页面展示后端图片时，优先复用 `frontend/src/utils/image.ts` 中的 `getImageUrl`

## 当前任务注意点
- `backend/app.js` 启动时会连接数据库，并执行 `DROP TABLE IF EXISTS disputes` 与 `sequelize.sync({ alter: { drop: false } })`
- Windows 环境下需要特别注意上传返回 URL 的路径分隔符是否为 `/`
