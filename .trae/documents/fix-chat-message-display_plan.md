# 对话界面发送消息不即时显示问题修复方案

## 问题分析

经过代码分析，发现发送消息后需要手动刷新才能看到消息的原因是：

**问题根源**: `frontend/src/api/messages.ts` 中的 `sendMessage` 函数处理逻辑错误。

**代码流程分析**:
1. 后端发送消息接口返回结构：`{ message: 'Message sent successfully', data: fullMessage }`
2. 请求工具 `request.ts` 在处理响应时：当 `result.data !== undefined`，返回 `result.data`（即 `fullMessage`）
3. API 层额外调用了 `.then(res => res.data)`，此时 `res` 已经是 `fullMessage`，所以 `res.data` 是 `undefined`
4. 导致前端获取到的 `newMessage` 是 `undefined`，无法添加到消息列表

## 修复方案

修改 `frontend/src/api/messages.ts` 中的 `sendMessage` 函数，移除多余的 `.then(res => res.data)` 处理。

## 修改内容

| 文件 | 修改内容 |
|:---|:---|
| `frontend/src/api/messages.ts` | 修改 `sendMessage` 函数，移除 `.then(res => res.data)` |

## 修复步骤

1. 修改 `sendMessage` 函数，将：
   ```typescript
   export const sendMessage = (data: SendMessageParams): Promise<Message> => {
     return post<{ message: string; data: Message }>('/messages', data).then(res => res.data)
   }
   ```
   修改为：
   ```typescript
   export const sendMessage = (data: SendMessageParams): Promise<Message> => {
     return post<Message>('/messages', data)
   }
   ```

## 验证方案

1. 发送消息后，消息应立即显示在聊天界面
2. 不需要手动刷新即可看到新消息
3. 消息发送后自动滚动到底部

## 风险评估

- **低风险**: 修改仅限于 API 层的数据处理，不影响其他功能
- **影响范围**: 仅影响发送消息功能

## 相关文件

- `frontend/src/api/messages.ts` - 消息 API 定义
- `frontend/src/pages/chat/chat.vue` - 聊天页面
- `frontend/src/utils/request.ts` - 请求工具
- `backend/routes/messages.js` - 后端消息路由