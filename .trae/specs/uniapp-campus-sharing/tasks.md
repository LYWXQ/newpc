# 校园闲置物品共享平台 - 完善功能任务清单

## [x] 任务1: 配置前端 API 基础设置
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建前端 API 请求封装 (request.ts)
  - 配置 API 基础地址
  - 实现请求拦截器（添加 token）
  - 实现响应拦截器（错误处理）
- **Acceptance Criteria Addressed**: AC-1
- **Notes**: 统一封装 uni.request，便于后续维护

## [x] 任务2: 用户认证模块 API 对接
- **Priority**: P0
- **Depends On**: 任务1
- **Description**:
  - 对接注册 API (/api/auth/register)
  - 对接登录 API (/api/auth/login)
  - 对接获取用户信息 API (/api/auth/me)
  - 实现 token 存储和管理
  - 修改 login.vue 页面，替换模拟登录
  - 修改 register.vue 页面，实现真实注册
- **Acceptance Criteria Addressed**: AC-1
- **Notes**: 确保 JWT token 正确存储和使用

## [x] 任务3: 物品管理模块 API 对接
- **Priority**: P0
- **Depends On**: 任务2
- **Description**:
  - 对接物品列表 API (/api/items)
  - 对接物品详情 API (/api/items/:id)
  - 对接发布物品 API (/api/items)
  - 修改 index.vue 首页，获取真实推荐数据
  - 修改 items.vue 物品列表页
  - 修改 item-detail.vue 物品详情页
  - 修改 publish.vue 发布物品页
- **Acceptance Criteria Addressed**: AC-1
- **Notes**: 支持分页、筛选、排序功能

## [x] 任务4: 图片上传功能实现
- **Priority**: P0
- **Depends On**: 任务3
- **Description**:
  - 后端：实现图片上传接口 (/api/upload)
  - 后端：配置静态文件服务
  - 前端：实现图片选择和上传组件
  - 前端：在发布物品页集成图片上传
  - 前端：在用户信息页集成头像上传
- **Acceptance Criteria Addressed**: AC-2
- **Notes**: 使用本地存储，限制图片大小和格式

## [x] 任务5: 订单管理模块 API 对接
- **Priority**: P0
- **Depends On**: 任务2
- **Description**:
  - 对接订单列表 API (/api/orders)
  - 对接订单详情 API (/api/orders/:id)
  - 对接创建订单 API (/api/orders)
  - 对接订单状态更新 API
  - 修改 orders.vue 订单列表页
  - 修改 order-detail.vue 订单详情页
  - 在 item-detail.vue 添加借用申请功能
- **Acceptance Criteria Addressed**: AC-1, AC-4
- **Notes**: 确保订单状态流转正确

## [x] 任务6: 消息通知模块完善
- **Priority**: P1
- **Depends On**: 任务2
- **Description**:
  - 对接消息列表 API (/api/messages)
  - 对接发送消息 API (/api/messages)
  - 对接标记已读 API
  - 修改 messages.vue 消息中心页
  - 修改 chat.vue 聊天页
  - 实现未读消息数显示（TabBar 角标）
- **Acceptance Criteria Addressed**: AC-3
- **Notes**: 聊天功能可先使用轮询方式

## [x] 任务7: 评价系统 API 对接
- **Priority**: P1
- **Depends On**: 任务5
- **Description**:
  - 对接评价列表 API (/api/reviews)
  - 对接创建评价 API (/api/reviews)
  - 在订单完成后显示评价入口
  - 在 item-detail.vue 显示物品评价
- **Acceptance Criteria Addressed**: AC-1
- **Notes**: 评价与订单状态联动

## [x] 任务8: 智能推荐功能实现
- **Priority**: P2
- **Depends On**: 任务3
- **Description**:
  - 后端：实现推荐算法
  - 后端：对接推荐 API (/api/recommendations)
  - 前端：首页显示热门推荐
  - 前端：根据用户行为推荐物品
- **Acceptance Criteria Addressed**: AC-5
- **Notes**: 基于浏览量和租借量排序

## [x] 任务9: 个人中心功能完善
- **Priority**: P1
- **Depends On**: 任务2
- **Description**:
  - 对接用户信息更新 API
  - 对接我的物品列表 API
  - 对接我的订单统计 API
  - 完善 profile.vue 个人中心页
  - 实现个人信息编辑功能
- **Acceptance Criteria Addressed**: AC-1
- **Notes**: 显示用户诚信分、发布数、订单数等统计

## [x] 任务10: UI 界面优化
- **Priority**: P1
- **Depends On**: 任务3, 任务5, 任务6
- **Description**:
  - 优化首页布局和样式
  - 优化物品卡片设计
  - 添加加载状态和空状态提示
  - 优化错误提示信息
  - 添加页面过渡动画
  - 统一配色和字体规范
- **Acceptance Criteria Addressed**: AC-5
- **Notes**: 遵循校园风格设计，蓝白配色

## [x] 任务11: 搜索功能完善
- **Priority**: P1
- **Depends On**: 任务3
- **Description**:
  - 对接搜索 API
  - 完善 search.vue 搜索页
  - 实现搜索历史记录
  - 实现热门搜索推荐
- **Acceptance Criteria Addressed**: AC-1
- **Notes**: 支持关键词搜索和筛选

## [x] 任务12: 系统测试与优化
- **Priority**: P1
- **Depends On**: 所有前置任务
- **Description**:
  - 进行端到端功能测试
  - 测试所有 API 接口
  - 优化性能（图片加载、请求缓存）
  - 修复发现的 bug
  - 完善错误处理
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Notes**: 重点测试用户认证、物品发布、订单流程

# Task Dependencies
- 任务2 依赖 任务1
- 任务3 依赖 任务2
- 任务4 依赖 任务3
- 任务5 依赖 任务2
- 任务6 依赖 任务2
- 任务7 依赖 任务5
- 任务8 依赖 任务3
- 任务9 依赖 任务2
- 任务10 依赖 任务3, 任务5, 任务6
- 任务11 依赖 任务3
- 任务12 依赖 所有前置任务
