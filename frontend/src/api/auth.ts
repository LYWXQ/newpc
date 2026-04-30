/**
 * 用户认证相关 API
 */
import { get, post, upload } from '@/utils/request'

export type DeletionStatus = 'none' | 'pending' | 'deleted'

// 用户信息接口
export interface UserInfo {
  id: number
  studentId?: string
  username: string
  avatar?: string
  creditScore: number
  isVerified: boolean
  status: string
  role: 'user' | 'admin' | 'root' | 'superadmin'
  phone?: string | null
  qq?: string | null
  email?: string | null
  school?: string | null
  major?: string | null
  deletionStatus?: DeletionStatus
  deletionRequestedAt?: string | null
  deletionDeadlineAt?: string | null
  deletionCancelledAt?: string | null
  anonymizedAt?: string | null
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
  qq: string
  email?: string
  school?: string
  major?: string
}

export interface LoginSuccessResponse {
  token: string
  user: UserInfo
  message: string
}

export interface PendingDeletionLoginResponse {
  message: string
  actionRequired: 'confirmDeletionLogin'
  pendingLoginToken: string
  deletionStatus: 'pending'
  deletionRequestedAt: string
  deletionDeadlineAt: string
  userPreview: Pick<UserInfo, 'id' | 'studentId' | 'username' | 'avatar' | 'role'>
}

export type LoginResponse = LoginSuccessResponse | PendingDeletionLoginResponse

export interface ResolveDeletionLoginParams {
  pendingLoginToken: string
  action: 'continue' | 'abort'
}

export interface AbortDeletionLoginResponse {
  message: string
  aborted: true
  deletionStatus: 'pending'
  deletionRequestedAt: string
  deletionDeadlineAt: string
}

/**
 * 用户登录
 */
export const login = (data: LoginParams): Promise<LoginResponse> => {
  return post<LoginResponse>('/auth/login', data, { showLoading: true })
}

export const resolveDeletionLogin = (data: ResolveDeletionLoginParams): Promise<LoginSuccessResponse | AbortDeletionLoginResponse> => {
  return post<LoginSuccessResponse | AbortDeletionLoginResponse>('/auth/login/resolve-deletion', data, { showLoading: true })
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

export const requestAccountDeletion = (): Promise<{
  message: string
  deletionStatus: 'pending'
  deletionRequestedAt: string
  deletionDeadlineAt: string
}> => {
  return post('/users/deletion-request')
}

export const cancelAccountDeletion = (): Promise<{ message: string; user: UserInfo }> => {
  return post('/users/deletion-request/cancel')
}

/**
 * 上传头像
 */
export const uploadAvatar = async (filePath: string): Promise<{ url: string }> => {
  const uploadResult = await upload<{ url: string }>('/upload/avatar', filePath, undefined, 'avatar')
  return post<{ url: string }>('/users/avatar', { avatar: uploadResult.url })
}
