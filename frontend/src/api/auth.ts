/**
 * 用户认证相关 API
 */
import { get, post, upload } from '@/utils/request'

// 用户信息接口
export interface UserInfo {
  id: number
  studentId?: string
  username: string
  avatar?: string
  creditScore: number
  isVerified: boolean
  status: string
  role: 'user' | 'admin' | 'root'
  phone?: string
  email?: string
  school?: string
  major?: string
  createdAt: string
  updatedAt: string
}

// 登录参数
export interface LoginParams {
  account: string
  password: string
  loginType: 'user' | 'admin'
}

// 注册参数
export interface RegisterParams {
  studentId: string
  username: string
  password: string
  phone: string
  email?: string
  school?: string
  major?: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: UserInfo
}

/**
 * 用户登录
 */
export const login = (data: LoginParams): Promise<LoginResponse> => {
  return post<LoginResponse>('/auth/login', data, { showLoading: true })
}

/**
 * 用户注册
 */
export const register = (data: RegisterParams): Promise<{ message: string; user: UserInfo }> => {
  return post('/auth/register', data)
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (params?: any, options?: any): Promise<UserInfo> => {
  return get<UserInfo>('/auth/me', params, options)
}

/**
 * 更新用户信息
 */
export const updateUserInfo = (data: Partial<UserInfo>): Promise<UserInfo> => {
  return post<UserInfo>('/users/profile', data)
}

/**
 * 上传头像
 */
export const uploadAvatar = async (filePath: string): Promise<{ url: string }> => {
  const uploadResult = await upload<{ url: string }>('/upload/avatar', filePath, undefined, 'avatar')
  return post<{ url: string }>('/users/avatar', { avatar: uploadResult.url })
}
