# 前后端项目结构Skill创建计划

## 1. 仓库研究结论

### 项目结构概述

**前端项目 (frontend/)**：
- 技术栈：UniApp + Vue 3 + TypeScript + Pinia + Vite
- 主要目录：
  - `src/api/` - API接口定义
  - `src/pages/` - 页面组件（20+页面）
  - `src/components/` - 可复用组件
  - `src/stores/` - Pinia状态管理
  - `src/utils/` - 工具函数
  - `src/static/` - 静态资源

**后端项目 (backend/)**：
- 技术栈：Node.js + Express + MySQL + Sequelize
- 主要目录：
  - `routes/` - API路由定义（10+路由文件）
  - `controllers/` - 业务逻辑控制器
  - `models/` - 数据库模型定义（6个模型）
  - `middleware/` - 中间件（认证等）
  - `config/` - 配置文件
  - `scripts/` - 辅助脚本

## 2. 创建的文件

### 前端Skill文档
- **路径**: `.trae/skills/frontend-project/SKILL.md`
- **内容**: 前端项目结构、技术栈、关键文件说明、使用场景

### 后端Skill文档
- **路径**: `.trae/skills/backend-project/SKILL.md`  
- **内容**: 后端项目结构、技术栈、API接口、数据库模型、使用场景

## 3. 实现步骤

### 步骤 1：创建前端Skill文档
- 描述前端项目结构
- 说明技术栈和关键依赖
- 列出主要页面和功能模块
- 提供使用场景和示例

### 步骤 2：创建后端Skill文档
- 描述后端项目结构
- 说明技术栈和关键依赖
- 列出API接口和路由
- 描述数据库模型
- 提供使用场景和示例

### 步骤 3：验证文件创建
- 确认两个Skill文档已正确创建
- 确保内容完整准确

## 4. 使用场景

### 前端Skill使用场景
- 快速了解项目结构
- 查找特定页面或组件
- 理解状态管理模式
- 了解API调用方式

### 后端Skill使用场景
- 快速了解API接口
- 查找路由和控制器
- 理解数据库模型关系
- 定位业务逻辑位置

## 5. 风险处理

- 项目结构可能随时间变化，需要定期更新Skill文档
- 确保路径和文件名准确无误
- 保持文档简洁明了，便于AI快速读取
