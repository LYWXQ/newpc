/**
 * 用户管理相关 API
 */
import { get, post, put } from '@/utils/request'
import type { UserInfo } from './auth'

// 获取用户信息
export const getUserProfile = (id: number): Promise<{ user: UserInfo }> => {
  return get<{ user: UserInfo }>(`/users/${id}`)
}
