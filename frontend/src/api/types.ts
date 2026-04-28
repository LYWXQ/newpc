/**
 * 通用类型定义
 */

// 通用分页响应接口
export interface PaginationData<T> {
  items?: T[]
  orders?: T[]
  messages?: T[]
  reviews?: T[]
  users?: T[]
  admins?: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
