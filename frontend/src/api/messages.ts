/**
 * 消息通知相关 API
 */
import { get, post, put, del } from '@/utils/request'
import type { PaginationData } from './types'

export type MessageType = 'system' | 'text' | 'image'

export interface ItemInfo {
  id: number
  title: string
  images?: string | string[]
  price?: number
  deposit?: number
  transactionType?: 'free' | 'rent' | 'sell'
}

export interface UserInfo {
  id: number
  username: string
  avatar?: string
}

export interface Message {
  id: number
  senderId: number | null
  receiverId: number
  itemId?: number | null
  type: MessageType
  content: string
  isRead: boolean
  relatedId?: number
  relatedType?: string
  createdAt: string
  sender?: UserInfo
  receiver?: UserInfo
  item?: ItemInfo | null
}

export interface MessageGroup {
  groupKey: string
  itemId: number | null
  item?: ItemInfo | null
  title: string
  latestMessageId: number
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  totalCount: number
}

export interface MessageGroupQuery {
  page?: number
  limit?: number
}

export interface MessageDetailQuery {
  page?: number
  limit?: number
  type?: 'system'
  itemId?: number
  groupKey?: string
}

export const getMessageGroups = (params?: MessageGroupQuery): Promise<PaginationData<MessageGroup>> => {
  return get<PaginationData<MessageGroup>>('/messages/groups', params)
}

export const getMessageList = (params?: MessageDetailQuery): Promise<PaginationData<Message>> => {
  return get<PaginationData<Message>>('/messages', params)
}

export const markAsRead = (messageId: number): Promise<{ message: string }> => {
  return put(`/messages/${messageId}/read`)
}

export const markGroupAsRead = (data: { itemId?: number | null; groupKey?: string }): Promise<{ message: string; updatedCount: number }> => {
  return put('/messages/read-by-group', data)
}

export const markAllAsRead = (): Promise<{ message: string }> => {
  return put('/messages/read-all')
}

export const getUnreadCount = (options?: any): Promise<{ count: number }> => {
  return get('/messages/unread/count', undefined, options)
}

export const deleteMessage = (messageId: number): Promise<{ message: string }> => {
  return del(`/messages/${messageId}`)
}

export const deleteMessageGroup = (data: { itemId?: number | null; groupKey?: string }): Promise<{ message: string; deletedCount: number }> => {
  return del('/messages/by-group', data)
}

export const sendSystemMessage = (data: {
  receiverId: number
  content: string
  relatedId?: number
  relatedType?: string
  itemId?: number | null
}): Promise<{ message: string; data: Message }> => {
  return post('/messages/system', data)
}

export const clearUserMessages = (usernames: string[]): Promise<{ message: string; deletedCount: number; clearedUsers: string[] }> => {
  return del('/messages/clear-users', { usernames })
}
