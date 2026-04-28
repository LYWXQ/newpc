/**
 * 用户认证相关 API
 */
import { get, post } from '@/utils/request'

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
}

// 注册参数
export interface RegisterParams {
  studentId: string
  username: string
  password: string
  phone?: string
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
export const uploadAvatar = (filePath: string): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: 'http://localhost:3000/api/users/avatar',
      filePath,
      name: 'avatar',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            resolve(data)
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: reject
    })
  })
}
