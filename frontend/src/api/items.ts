/**
 * 物品管理相关 API
 */
import { get, post, put, del } from '@/utils/request'
import type { PaginationData } from './types'

// 物品信息接口
export interface Item {
  id: number
  title: string
  description: string
  category: string
  images: string[]
  price: number
  deposit: number
  transactionType: 'free' | 'rent' | 'sell'
  salePrice: number | null
  isLongTermRent: boolean
  availableTime: {
    start?: string
    end?: string
  }
  location?: string
  status: 'available' | 'rented' | 'reviewing' | 'offline'
  viewCount: number
  userId: number
  user?: UserInfo
  createdAt: string
  updatedAt: string
}

// 用户信息（简版）
interface UserInfo {
  id: number
  username: string
  avatar?: string
  creditScore: number
  isVerified: boolean
}

// 物品列表参数
export interface ItemListParams {
  page?: number
  limit?: number
  category?: string
  keyword?: string
  sort?: 'newest' | 'price_asc' | 'price_desc'
  transactionType?: 'free' | 'rent' | 'sell'
}

// 发布物品参数
export interface CreateItemParams {
  title: string
  description: string
  category: string
  images: string[]
  price: number
  deposit: number
  transactionType: 'free' | 'rent' | 'sell'
  salePrice: number | null
  isLongTermRent: boolean
  availableTime?: {
    start?: string
    end?: string
  }
  location?: string
}

/**
 * 获取物品列表
 */
export const getItemList = (params?: ItemListParams): Promise<PaginationData<Item>> => {
  return get<PaginationData<Item>>('/items', params)
}

/**
 * 获取物品详情
 */
export const getItemDetail = (id: number): Promise<{ item: Item }> => {
  return get<{ item: Item }>(`/items/${id}`)
}

/**
 * 发布物品
 */
export const createItem = (data: CreateItemParams, options?: any): Promise<{ message: string; item: Item }> => {
  return post('/items', data, options)
}

/**
 * 更新物品
 */
export const updateItem = (id: number, data: Partial<CreateItemParams>): Promise<{ message: string; item: Item }> => {
  return put(`/items/${id}`, data)
}

/**
 * 删除物品
 */
export const deleteItem = (id: number): Promise<{ message: string }> => {
  return del(`/items/${id}`)
}

/**
 * 获取我的物品列表
 */
export const getMyItems = (params?: { page?: number; limit?: number; status?: string }, options?: any): Promise<PaginationData<Item>> => {
  return get<PaginationData<Item>>('/items/mine', params, options)
}

/**
 * 获取我的物品总数
 */
export const getMyItemsCount = (params?: { status?: string }): Promise<{ total: number }> => {
  return getMyItems({ page: 1, limit: 1, ...params }).then(res => ({ total: res.pagination.total }))
}

/**
 * 获取物品分类列表
 */
export const getCategories = (): Promise<string[]> => {
  return Promise.resolve(['全部', '图书', '电子产品', '运动器材', '生活用品', '服装', '其他'])
}
