---
name: backend-project
description: 校园闲置共享平台后端项目结构说明。用于快速了解后端项目的目录结构、技术栈、API路由和数据库模型。
metadata:
  author: Project Team
  version: "1.0.0"
---

# 后端项目结构

## 技术栈

- **语言**: Node.js
- **框架**: Express.js
- **数据库**: MySQL
- **ORM**: Sequelize
- **认证**: JWT
- **文件上传**: Multer

## 项目目录结构

```
backend/
├── routes/               # API路由定义
│   ├── auth.js          # 认证路由 (登录/注册)
│   ├── items.js         # 物品路由 (CRUD)
│   ├── orders.js        # 订单路由 (创建/管理)
│   ├── users.js         # 用户路由 (资料/信息)
│   ├── messages.js      # 消息路由 (通知/聊天)
│   ├── reviews.js       # 评价路由 (评价管理)
│   ├── favorites.js     # 收藏路由 (收藏管理)
│   ├── upload.js        # 上传路由 (文件上传)
│   ├── admin.js         # 管理路由 (管理员)
│   └── recommendations.js # 推荐路由
├── controllers/          # 业务逻辑控制器
│   ├── authController.js    # 认证逻辑
│   ├── favoriteController.js # 收藏逻辑
│   └── adminController.js   # 管理逻辑
├── models/               # 数据库模型
│   ├── User.js          # 用户模型
│   ├── Item.js          # 物品模型
│   ├── Order.js         # 订单模型
│   ├── Message.js       # 消息模型
│   ├── Review.js        # 评价模型
│   ├── Favorite.js      # 收藏模型
│   └── index.js         # 模型导出
├── middleware/           # 中间件
│   └── auth.js          # JWT认证中间件
├── config/               # 配置文件
│   └── database.js      # 数据库连接配置
├── scripts/              # 辅助脚本
│   ├── init-mock-data.js    # 初始化模拟数据
│   ├── init-superadmin.js   # 初始化超级管理员
│   ├── init-users.js        # 初始化用户
│   ├── check-users.js       # 检查用户数据
│   ├── check-items.js       # 检查物品数据
│   ├── clear-messages.js    # 清除消息
│   └── update-item-status.js # 更新物品状态
├── uploads/              # 上传文件存储
├── app.js               # 应用入口
├── .env                 # 环境变量
└── package.json         # 依赖配置
```

## 核心模块说明

### 路由模块 (`routes/`)

| 路由文件 | 路径前缀 | 功能描述 |
|----------|----------|----------|
| auth.js | `/api/auth` | 登录、注册、获取用户信息 |
| items.js | `/api/items` | 物品CRUD、搜索、筛选 |
| orders.js | `/api/orders` | 订单创建、状态管理 |
| users.js | `/api/users` | 用户资料、认证 |
| messages.js | `/api/messages` | 消息列表、发送消息 |
| reviews.js | `/api/reviews` | 评价管理 |
| favorites.js | `/api/favorites` | 收藏管理 |
| upload.js | `/api/upload` | 图片上传 |
| admin.js | `/api/admin` | 管理员功能 |

### 数据库模型 (`models/`)

#### User (用户模型)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| studentId | STRING | 学号 |
| username | STRING | 用户名 |
| password | STRING | 加密密码 |
| phone | STRING | 手机号 |
| role | STRING | 角色(user/admin/root) |
| creditScore | INTEGER | 信用分 |
| isVerified | BOOLEAN | 是否认证 |

#### Item (物品模型)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| title | STRING | 物品标题 |
| description | TEXT | 物品描述 |
| category | STRING | 分类 |
| price | DECIMAL | 租金/天 |
| deposit | DECIMAL | 押金 |
| images | JSON | 图片列表 |
| transactionType | STRING | 交易类型 |
| location | STRING | 交易地点 |
| userId | INTEGER | 发布者ID |

#### Order (订单模型)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| itemId | INTEGER | 物品ID |
| lenderId | INTEGER | 出借方ID |
| borrowerId | INTEGER | 借入方ID |
| status | STRING | 订单状态 |
| totalPrice | DECIMAL | 总金额 |
| deposit | DECIMAL | 押金 |

### 中间件 (`middleware/auth.js`)
- 验证JWT token
- 将用户信息注入req.user
- 保护需要登录的路由

## API接口速查

### 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/current` | 获取当前用户 |
| POST | `/api/auth/logout` | 用户登出 |

### 物品接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/items` | 获取物品列表 |
| GET | `/api/items/:id` | 获取物品详情 |
| POST | `/api/items` | 发布物品 |
| PUT | `/api/items/:id` | 更新物品 |
| DELETE | `/api/items/:id` | 删除物品 |

### 订单接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/orders` | 获取订单列表 |
| POST | `/api/orders` | 创建订单 |
| PUT | `/api/orders/:id/approve` | 同意订单 |
| PUT | `/api/orders/:id/reject` | 拒绝订单 |
| PUT | `/api/orders/:id/complete` | 完成订单 |

## 使用场景

### 场景1: 添加新API路由
1. 在 `routes/` 下创建新路由文件
2. 定义路由和处理函数
3. 在 `app.js` 中注册路由

### 场景2: 添加新模型
1. 在 `models/` 下创建模型文件
2. 定义字段和关联关系
3. 在 `models/index.js` 中导出

### 场景3: 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 场景4: 执行脚本
```bash
# 初始化模拟数据
node scripts/init-mock-data.js

# 初始化超级管理员
node scripts/init-superadmin.js
```

## 数据库配置

环境变量配置 (`.env`):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=campus_sharing
JWT_SECRET=your-secret-key
PORT=3000
```

## 模型关系

```
User 1:N Item    (用户发布物品)
User 1:N Order (用户参与订单)
Item 1:N Order  (物品被下单)
User 1:N Message (用户消息)
Order 1:N Review  (订单评价)
User 1:N Favorite (用户收藏)
```
