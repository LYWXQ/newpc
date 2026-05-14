# 校园闲置物品共享平台毕业设计论文 - 产品需求文档

## Overview
- **Summary**: 基于 Uni-app + Node.js 的校园闲置物品共享平台的设计与实现，支持物品发布、浏览、收藏、租赁/出售、评价、纠纷处理等完整功能。
- **Purpose**: 解决校园闲置资源利用率低的问题，构建安全可信的校园共享生态。
- **Target Users**: 在校大学生、校园管理员

## Goals
- 生成符合中文本科毕业论文规范的完整论文
- 论文字数达到约30000字
- 严格贴合项目真实代码与数据库结构
- 突出校园共享平台的特色与创新点

## Non-Goals (Out of Scope)
- 不添加代码片段
- 不编造未实现的技术（如Redis、微服务、支付系统等）
- 不虚构功能模块

## Background & Context
- 前端技术栈：Uni-app + Vue 3 + TypeScript + Pinia + Vite
- 后端技术栈：Node.js + Express + Sequelize + MySQL + JWT
- 核心功能：用户认证、物品管理、订单交易、评价系统、纠纷处理、管理员治理

## Functional Requirements
- **FR-1**: 用户注册与登录（学号、手机号、密码）
- **FR-2**: 物品发布与管理（标题、分类、图片、价格、押金）
- **FR-3**: 订单交易流程（预约、取件、归还、完成）
- **FR-4**: 评价系统（评分、内容、图片）
- **FR-5**: 纠纷处理（申请、举证、裁决）
- **FR-6**: 管理员治理（用户管理、订单管理、纠纷处理）
- **FR-7**: 账号注销与匿名化（7天冷静期）
- **FR-8**: 消息通知与订单提醒

## Non-Functional Requirements
- **NFR-1**: 论文结构完整，符合学术规范
- **NFR-2**: 语言正式严谨，无口语化表达
- **NFR-3**: 内容贴合实际代码，不虚构技术
- **NFR-4**: 字数约30000字

## Constraints
- **Technical**: 必须基于现有项目代码和数据库结构
- **Business**: 符合本科毕业论文要求

## Acceptance Criteria

### AC-1: 论文结构完整
- **Given**: 用户需要一篇完整的毕业论文
- **When**: 生成论文
- **Then**: 包含摘要、关键词、绪论、相关技术、需求分析、系统设计、数据库设计、系统实现、测试、总结、参考文献、致谢
- **Verification**: `human-judgment`

### AC-2: 内容贴合真实代码
- **Given**: 项目有明确的数据库表结构
- **When**: 撰写数据库设计章节
- **Then**: 所有表结构描述与实际代码一致，字段不遗漏、不错误
- **Verification**: `programmatic`

### AC-3: 功能模块描述准确
- **Given**: 前端有明确的页面结构
- **When**: 撰写系统实现章节
- **Then**: 描述的功能与实际页面功能一致
- **Verification**: `human-judgment`

### AC-4: 无虚构技术内容
- **Given**: 项目未使用Redis、微服务等技术
- **When**: 撰写论文
- **Then**: 不提及或虚构这些未实现的技术
- **Verification**: `human-judgment`

### AC-5: 字数达标
- **Given**: 要求约30000字
- **When**: 生成论文
- **Then**: 论文正文字数在28000-32000字之间
- **Verification**: `programmatic`