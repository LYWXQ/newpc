---
name: frontend-project
description: 校园闲置共享平台前端项目结构说明。用于快速了解前端项目的目录结构、技术栈、页面组件和API调用方式。
metadata:
  author: Project Team
  version: "1.0.0"
---

# 前端项目结构

## 技术栈

- **框架**: UniApp
- **语言**: TypeScript
- **状态管理**: Pinia
- **构建工具**: Vite
- **样式**: SCSS

## 项目目录结构

```
frontend/
├── src/
│   ├── api/              # API接口定义
│   │   ├── auth.ts       # 认证相关接口
│   │   ├── items.ts      # 物品相关接口
│   │   ├── orders.ts     # 订单相关接口
│   │   ├── messages.ts   # 消息相关接口
│   │   ├── users.ts      # 用户相关接口
│   │   ├── favorites.ts  # 收藏相关接口
│   │   ├── reviews.ts    # 评价相关接口
│   │   ├── types.ts      # 类型定义
│   │   └── index.ts      # API统一导出
│   ├── pages/            # 页面组件
│   │   ├── index/        # 首页
│   │   ├── login/        # 登录页
│   │   ├── register/     # 注册页
│   │   ├── profile/      # 个人中心
│   │   ├── orders/       # 订单列表
│   │   ├── publish/      # 发布物品
│   │   ├── item-detail/  # 物品详情
│   │   ├── messages/     # 消息中心
│   │   ├── chat/         # 聊天页面
│   │   ├── favorites/    # 我的收藏
│   │   ├── reviews/      # 我的评价
│   │   ├── my-items/     # 我的发布
│   │   ├── edit-profile/ # 编辑资料
│   │   ├── search/       # 搜索页面
│   │   ├── order-detail/ # 订单详情
│   │   ├── review/       # 评价订单
│   │   └── admin/        # 管理后台
│   ├── components/       # 可复用组件
│   │   └── AuthGuard.vue # 登录守卫组件
│   ├── stores/           # Pinia状态管理
│   │   └── auth.ts       # 认证状态管理
│   ├── utils/            # 工具函数
│   │   ├── request.ts    # HTTP请求封装
│   │   ├── auth.ts       # 权限检查工具
│   │   ├── image.ts      # 图片处理工具
│   │   ├── constants.ts  # 常量定义
│   │   └── universities.ts # 学校数据
│   ├── static/           # 静态资源
│   │   ├── tabbar/       # TabBar图标
│   │   └── logo.png      # 项目Logo
│   ├── App.vue           # 应用根组件
│   ├── main.ts           # 应用入口
│   ├── pages.json        # 页面配置
│   ├── manifest.json     # 应用配置
│   └── uni.scss          # 全局样式
├── vite.config.ts        # Vite配置
├── tsconfig.json         # TypeScript配置
├── package.json          # 依赖配置
└── project.config.json   # 项目配置
```

## 核心模块说明

### API层 (`src/api/`)
- 统一管理所有后端API接口
- 使用Promise封装异步请求
- 包含完整的类型定义

### 页面模块 (`src/pages/`)
| 页面 | 路径 | 功能描述 |
|------|------|----------|
| 首页 | `/pages/index/index` | 物品列表、搜索、分类筛选 |
| 登录 | `/pages/login/login` | 用户登录 |
| 注册 | `/pages/register/register` | 用户注册 |
| 个人中心 | `/pages/profile/profile` | 用户信息、功能入口 |
| 订单列表 | `/pages/orders/orders` | 我的订单管理 |
| 发布物品 | `/pages/publish/publish` | 发布闲置物品 |
| 物品详情 | `/pages/item-detail/item-detail` | 物品详情展示 |
| 消息中心 | `/pages/messages/messages` | 系统通知和聊天消息 |

### 状态管理 (`src/stores/auth.ts`)
- 管理用户登录状态
- 存储token和用户信息
- 提供登录/登出方法

### 工具函数 (`src/utils/`)
- `request.ts`: 封装uni.request，自动携带token
- `auth.ts`: 权限检查和登录状态管理
- `image.ts`: 图片URL处理

## 使用场景

### 场景1: 查找页面位置
当需要修改某个页面时，通过目录结构快速定位：
```
需求: 修改首页搜索功能
路径: frontend/src/pages/index/index.vue
```

### 场景2: 添加新页面
1. 在 `src/pages/` 下创建新目录
2. 添加页面文件 `.vue`
3. 在 `pages.json` 中注册路由

### 场景3: 调用API
```typescript
import { login, getItemList } from '@/api'

// 登录
const { token, user } = await login(account, password)

// 获取物品列表
const { items } = await getItemList({ page: 1, limit: 10 })
```

### 场景4: 检查登录状态
```typescript
import { isLoggedIn, requireAuth } from '@/utils/auth'

// 检查是否登录
if (!isLoggedIn()) {
  requireAuth('/pages/index/index')
}
```

## 启动命令

```bash
# 开发模式
npm run dev:h5

# 构建生产版本
npm run build:h5

# 微信小程序开发
npm run dev:mp-weixin
```
