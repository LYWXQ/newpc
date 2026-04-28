/**
 * 收藏相关 API
 */
import { get, post, del } from '@/utils/request'

// 收藏项接口
export interface Favorite {
  id: number
  userId: number
  itemId: number
  createdAt: string
  item: {
    id: number
    title: string
    price: number
    deposit: number
    images: string[]
    status: string
    user: {
      id: number
      username: string
      avatar: string
    }
  }
}

// 收藏列表响应
export interface FavoritesResponse {
  favorites: Favorite[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// 添加收藏
export const addFavorite = (itemId: number): Promise<{ message: string; favorite: Favorite }> => {
  return post<{ message: string; favorite: Favorite }>('/favorites', { itemId })
}

// 取消收藏
export const removeFavorite = (itemId: number): Promise<{ message: string }> => {
  return del<{ message: string }>(`/favorites/${itemId}`)
}

// 批量取消收藏
export const batchRemoveFavorites = (itemIds: number[]): Promise<{ message: string; removedCount: number }> => {
  return del<{ message: string; removedCount: number }>('/favorites/batch', { itemIds })
}

// 获取收藏列表
export const getFavorites = (page = 1, limit = 10): Promise<FavoritesResponse> => {
  return get<FavoritesResponse>('/favorites', { page, limit })
}

// 检查收藏状态
export const checkFavoriteStatus = (itemId: number): Promise<{ isFavorite: boolean; favoriteId: number | null }> => {
  return get<{ isFavorite: boolean; favoriteId: number | null }>(`/favorites/check/${itemId}`)
}

// 获取收藏数量
export const getFavoriteCount = (): Promise<{ count: number }> => {
  return get<{ count: number }>('/favorites/count')
}
