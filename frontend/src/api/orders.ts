/**
 * 订单管理相关 API
 */
import { get, post, put } from '@/utils/request'
import type { PaginationData } from './types'

// 订单状态
type OrderStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'

// 订单信息接口
export interface Order {
  id: number
  itemId: number
  lenderId: number
  borrowerId: number
  status: OrderStatus
  startDate: string
  endDate: string
  totalPrice: number
  deposit: number
  note?: string
  cancelReason?: string
  createdAt: string
  updatedAt: string
  item?: ItemInfo
  lender?: UserInfo
  borrower?: UserInfo
}

// 物品信息（简版）
interface ItemInfo {
  id: number
  title: string
  images: string[]
  price: number
  deposit: number
}

// 用户信息（简版）
interface UserInfo {
  id: number
  username: string
  avatar?: string
  phone?: string
}

// 创建订单参数
export interface CreateOrderParams {
  itemId: number
  startDate: string
  endDate: string
  note?: string
}

// 更新订单参数
export interface UpdateOrderParams {
  status?: OrderStatus
  cancelReason?: string
}

/**
 * 获取订单列表
 */
export const getOrderList = (params?: { page?: number; limit?: number; status?: string; role?: 'lender' | 'borrower' }): Promise<PaginationData<Order>> => {
  return get<PaginationData<Order>>('/orders', params)
}

/**
 * 获取订单详情
 */
export const getOrderDetail = (id: number): Promise<{ order: Order }> => {
  return get<{ order: Order }>(`/orders/${id}`)
}

/**
 * 创建订单
 */
export const createOrder = (data: CreateOrderParams): Promise<{ message: string; order: Order }> => {
  return post('/orders', data)
}

/**
 * 更新订单状态
 */
export const updateOrder = (id: number, data: UpdateOrderParams): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}`, data)
}

/**
 * 同意订单
 */
export const approveOrder = (id: number): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/approve`)
}

/**
 * 拒绝订单
 */
export const rejectOrder = (id: number, reason?: string): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/reject`, { reason })
}

/**
 * 确认取货
 */
export const confirmPickup = (id: number): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/pickup`)
}

/**
 * 完成订单
 */
export const completeOrder = (id: number): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/complete`)
}

/**
 * 取消订单
 */
export const cancelOrder = (id: number, reason?: string): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/cancel`, { reason })
}

/**
 * 获取我的订单统计
 */
export const getOrderStats = (options?: any): Promise<{
  totalAsLender: number
  totalAsBorrower: number
  pendingCount: number
  inProgressCount: number
  completedCount: number
}> => {
  return get('/orders/stats', undefined, options)
}
