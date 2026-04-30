/**
 * 消息通知相关 API
 */
import { get, post, put, del } from '@/utils/request'
import type { PaginationData } from './types'

// 消息类型
type MessageType = 'system' | 'text' | 'image'



// 物品信息（简版）
export interface ItemInfo {
  id: number
  title: string
  images?: string
}

// 用户信息（简版）
export interface UserInfo {
  id: number
  username: string
  avatar?: string
}

// 消息信息接口
export interface Message {
  id: number
  senderId: number | null
  receiverId: number
  itemId?: number
  type: MessageType
  content: string
  isRead: boolean
  relatedId?: number
  relatedType?: string
  createdAt: string
  sender?: UserInfo
  receiver?: UserInfo
  item?: ItemInfo
}

// 聊天会话接口（用于消息列表）
export interface ChatConversation {
  id: number
  itemId: number
  item?: ItemInfo
  otherUserId: number
  otherUser?: UserInfo
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  type: 'chat'
}

// 发送消息参数
export interface SendMessageParams {
  receiverId: number
  content: string
  type?: MessageType
  itemId?: number
  relatedId?: number
  relatedType?: string
}

/**
 * 获取消息列表
 * type: 'system' | 'chat' - 系统消息或聊天消息
 */
export const getMessageList = (params?: { page?: number; limit?: number; type?: 'system' | 'chat' }): Promise<PaginationData<Message | ChatConversation>> => {
  return get<PaginationData<Message | ChatConversation>>('/messages', params)
}

/**
 * 获取与某个用户的聊天记录
 * 支持按物品筛选
 */
export const getChatHistory = (userId: number, params?: { page?: number; limit?: number; itemId?: number }): Promise<PaginationData<Message>> => {
  return get<PaginationData<Message>>(`/messages/chat/${userId}`, params)
}

/**
 * 发送消息
 */
export const sendMessage = (data: SendMessageParams): Promise<Message> => {
  return post<Message>('/messages', data)
}

/**
 * 标记消息为已读
 */
export const markAsRead = (messageId: number): Promise<{ message: string }> => {
  return put(`/messages/${messageId}/read`)
}

/**
 * 标记所有消息为已读
 */
export const markAllAsRead = (): Promise<{ message: string }> => {
  return put('/messages/read-all')
}

/**
 * 获取未读消息数
 */
export const getUnreadCount = (options?: any): Promise<{ count: number }> => {
  return get('/messages/unread/count', undefined, options)
}

/**
 * 删除消息
 */
export const deleteMessage = (messageId: number): Promise<{ message: string }> => {
  return del(`/messages/${messageId}`)
}

/**
 * 清空指定用户的所有消息（管理员接口）
 */
export const clearUserMessages = (usernames: string[]): Promise<{ message: string; deletedCount: number; clearedUsers: string[] }> => {
  return del('/messages/clear-users', { usernames })
}
