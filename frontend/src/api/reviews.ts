/**
 * 评价系统相关 API
 */
import { get, post } from '@/utils/request'
import type { PaginationData } from './types'

// 评价信息接口
export interface Review {
  id: number
  orderId: number
  reviewerId: number
  revieweeId: number
  rating: number
  content: string
  images: string[]
  isVisible: boolean
  createdAt: string
  reviewer?: UserInfo
  reviewee?: UserInfo
  order?: OrderInfo
}

// 用户信息（简版）
interface UserInfo {
  id: number
  username: string
  avatar?: string
}

// 订单信息（简版）
interface OrderInfo {
  id: number
  itemId: number
  item?: {
    id: number
    title: string
    images: string[]
  }
}

// 创建评价参数
export interface CreateReviewParams {
  orderId: number
  rating: number
  content: string
  images?: string[]
}

/**
 * 获取评价列表
 */
export const getReviewList = (params?: { page?: number; limit?: number; userId?: number; itemId?: number }): Promise<PaginationData<Review>> => {
  return get<PaginationData<Review>>('/reviews', params)
}

/**
 * 获取评价详情
 */
export const getReviewDetail = (id: number): Promise<{ review: Review }> => {
  return get<{ review: Review }>(`/reviews/${id}`)
}

/**
 * 创建评价
 */
export const createReview = (data: CreateReviewParams): Promise<{ message: string; review: Review }> => {
  return post('/reviews', data)
}

/**
 * 获取物品的评价列表
 */
export const getItemReviews = (itemId: number, params?: { page?: number; limit?: number }): Promise<PaginationData<Review>> => {
  return get<PaginationData<Review>>(`/reviews/item/${itemId}`, params)
}

/**
 * 获取用户的评价列表
 */
export const getUserReviews = (userId: number, params?: { page?: number; limit?: number; type?: 'given' | 'received' }): Promise<PaginationData<Review>> => {
  return get<PaginationData<Review>>(`/reviews/user/${userId}`, params)
}

/**
 * 获取订单的评价
 */
export const getOrderReview = (orderId: number): Promise<{ review: Review | null }> => {
  return get<{ review: Review | null }>(`/reviews/order/${orderId}`)
}
