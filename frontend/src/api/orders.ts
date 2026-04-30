/**
 * 订单管理相关 API
 */
import { get, post, put } from '@/utils/request'
import type { PaginationData } from './types'

export type OrderStatus = 'pending' | 'confirmed' | 'using' | 'returned' | 'completed' | 'cancelled'

interface UserInfo {
  id: number
  username: string
  avatar?: string
  creditScore?: number
  phone?: string
  qq?: string
}

interface ItemOwnerInfo {
  id: number
  username: string
  avatar?: string
  creditScore?: number
  isVerified?: boolean
  phone?: string
  qq?: string
}

interface ItemInfo {
  id: number
  title: string
  images: string[]
  price: number
  deposit: number
  transactionType?: 'free' | 'rent' | 'sell'
  user?: ItemOwnerInfo
}

export interface Order {
  id: number
  itemId: number
  lenderId: number
  borrowerId: number
  status: OrderStatus
  startDate: string
  endDate: string
  totalDays: number
  totalPrice: number
  deposit: number
  note?: string
  cancelReason?: string
  pickupLocation?: string
  returnLocation?: string
  pickupCode?: string | null
  returnCode?: string | null
  pickupCodeVerifiedAt?: string | null
  pickupConfirmedByLenderAt?: string | null
  actualPickupTime?: string | null
  returnCodeVerifiedAt?: string | null
  returnConfirmedByLenderAt?: string | null
  actualReturnTime?: string | null
  returnConfirmedTime?: string | null
  isEarlyReturn?: boolean
  pendingConfirmation?: boolean
  pendingExtension?: boolean
  createdAt: string
  updatedAt: string
  item?: ItemInfo
  lender?: UserInfo
  borrower?: UserInfo
}

export interface CreateOrderParams {
  itemId: number
  startDate: string
  endDate: string
  pickupLocation?: string
  returnLocation?: string
  note?: string
}

export interface ConfirmOrderParams {
  startDate?: string
  endDate?: string
  pickupLocation?: string
  returnLocation?: string
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
 * 卖方确认订单
 */
export const confirmOrder = (id: number, data?: ConfirmOrderParams): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/confirm`, data || {})
}

/**
 * 拒绝订单
 */
export const rejectOrder = (id: number, reason?: string): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/reject`, { reason })
}

/**
 * 确认取货（输入取件码）
 */
export const confirmPickup = (id: number, pickupCode: string): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/pickup`, { pickupCode })
}

/**
 * 确认修改（买方确认卖方的修改）
 */
export const confirmChanges = (id: number): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/confirm-changes`)
}

/**
 * 卖方确认已交付
 */
export const confirmPickupByLender = (id: number): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/confirm-pickup`)
}

/**
 * 提交归还码
 */
export const returnOrder = (id: number, returnCode: string): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/return`, { returnCode })
}

/**
 * 卖方确认已收回
 */
export const confirmReturnByLender = (id: number): Promise<{ message: string; order: Order }> => {
  return put(`/orders/${id}/confirm-return-receipt`)
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

export interface RoleOrderStats {
  pending: number
  confirmed: number
  using: number
  returned: number
  completed: number
  active: number
}

export interface OrderStats {
  totalAsLender: number
  totalAsBorrower: number
  pendingCount: number
  confirmedCount: number
  usingCount: number
  returnedCount: number
  completedCount: number
  roleStats: {
    lender: RoleOrderStats
    borrower: RoleOrderStats
  }
}

/**
 * 获取我的订单统计
 */
export const getOrderStats = (options?: any): Promise<OrderStats> => {
  return get('/orders/stats', undefined, options)
}
