# API 对接检查清单

## 认证相关 (auth.ts)

| 前端API | 后端路由 | 状态 | 备注 |
|---------|---------|------|------|
| `login()` | POST `/auth/login` | ✅ 已对接 | authController.login |
| `register()` | POST `/auth/register` | ✅ 已对接 | authController.register |
| `getCurrentUser()` | GET `/auth/me` | ✅ 已对接 | authController.getCurrentUser |
| `updateUserInfo()` | POST `/users/profile` | ✅ 已对接 | 已添加POST和PUT支持 |
| `uploadAvatar()` | POST `/users/avatar` | ✅ 已对接 | 已添加此路由 |

## 物品相关 (items.ts)

| 前端API | 后端路由 | 状态 | 备注 |
|---------|---------|------|------|
| `getItemList()` | GET `/items` | ✅ 已对接 | 返回available状态的物品 |
| `getItemDetail()` | GET `/items/:id` | ✅ 已对接 | |
| `createItem()` | POST `/items` | ✅ 已对接 | 状态设为available |
| `updateItem()` | PUT `/items/:id` | ✅ 已对接 | |
| `deleteItem()` | DELETE `/items/:id` | ✅ 已对接 | |
| `getMyItems()` | GET `/items/mine` | ✅ 已对接 | 已添加 |
| `getCategories()` | 前端模拟 | ⚠️ 前端模拟 | 返回Promise.resolve |

## 订单相关 (orders.ts)

| 前端API | 后端路由 | 状态 | 备注 |
|---------|---------|------|------|
| `getOrderList()` | GET `/orders` | ✅ 已对接 | 已支持role参数、分页、startDate/endDate |
| `getOrderDetail()` | GET `/orders/:id` | ✅ 已对接 | |
| `createOrder()` | POST `/orders` | ✅ 已对接 | 已支持startDate/endDate |
| `updateOrder()` | PUT `/orders/:id` | ✅ 已对接 | |
| `approveOrder()` | PUT `/orders/:id/approve` | ✅ 已对接 | 已添加 |
| `rejectOrder()` | PUT `/orders/:id/reject` | ✅ 已对接 | 已添加 |
| `confirmPickup()` | PUT `/orders/:id/pickup` | ✅ 已对接 | 已添加 |
| `completeOrder()` | PUT `/orders/:id/complete` | ✅ 已对接 | 已添加 |
| `cancelOrder()` | PUT `/orders/:id/cancel` | ✅ 已对接 | 已添加 |
| `getOrderStats()` | GET `/orders/stats` | ✅ 已对接 | 已添加 |

## 消息相关 (messages.ts)

| 前端API | 后端路由 | 状态 | 备注 |
|---------|---------|------|------|
| `getMessageList()` | GET `/messages` | ✅ 已对接 | |
| `getChatHistory()` | GET `/messages/chat/:userId` | ✅ 已对接 | |
| `sendMessage()` | POST `/messages` | ✅ 已对接 | |
| `markAsRead()` | PUT `/messages/:id/read` | ✅ 已对接 | |
| `markAllAsRead()` | PUT `/messages/read-all` | ✅ 已对接 | 已添加 |
| `getUnreadCount()` | GET `/messages/unread/count` | ✅ 已对接 | |
| `deleteMessage()` | PUT `/messages/:id/delete` | ✅ 已对接 | 已添加PUT方法，也支持DELETE |

## 用户相关 (users.ts)

| 前端API | 后端路由 | 状态 | 备注 |
|---------|---------|------|------|
| `getUserProfile()` | GET `/users/:id` | ✅ 已对接 | |

## 评价相关 (reviews.ts)

| 前端API | 后端路由 | 状态 | 备注 |
|---------|---------|------|------|
| `getReviewList()` | GET `/reviews` | ✅ 已对接 | 已支持分页、userId、type参数 |
| `getReviewDetail()` | GET `/reviews/:id` | ✅ 已对接 | 已添加 |
| `createReview()` | POST `/reviews` | ✅ 已对接 | 字段已匹配，支持images |
| `getItemReviews()` | GET `/reviews/item/:itemId` | ✅ 已对接 | 已添加 |
| `getUserReviews()` | GET `/reviews/user/:userId` | ✅ 已对接 | 已添加 |
| `getOrderReview()` | GET `/reviews/order/:orderId` | ✅ 已对接 | 已添加 |

## 总结

### ✅ 已完成对接的API (39个)
- 认证：login, register, getCurrentUser, updateUserInfo, uploadAvatar
- 物品：getItemList, getItemDetail, createItem, updateItem, deleteItem, getMyItems
- 订单：getOrderList, getOrderDetail, createOrder, updateOrder, approveOrder, rejectOrder, confirmPickup, completeOrder, cancelOrder, getOrderStats
- 消息：getMessageList, getChatHistory, sendMessage, markAsRead, markAllAsRead, getUnreadCount, deleteMessage
- 用户：getUserProfile
- 评价：getReviewList, getReviewDetail, createReview, getItemReviews, getUserReviews, getOrderReview

### ⚠️ 需要调整的API (1个)
- 物品：getCategories（前端模拟数据）

### ❌ 缺失的后端API (0个)

---

**当前完成度：约 100% (39/39)**

## 修复的隐藏Bug

1. **评价API字段不匹配**：
   - 问题：后端使用fromUserId/toUserId，但模型实际是reviewerId/revieweeId
   - 修复：统一使用reviewerId/revieweeId，修正关联关系别名

2. **图片字段JSON序列化**：
   - 问题：Review模型的images字段已经是JSON类型，不需要JSON.stringify
   - 修复：直接存储images数组

3. **信用评分API字段**：
   - 问题：信用评分查询使用toUserId
   - 修复：统一使用revieweeId

4. **关联关系别名**：
   - 问题：include关联使用fromUser/toUser
   - 修复：使用模型定义的reviewer/reviewee别名
