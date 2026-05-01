/**
 * 用户认证相关 API
 */
import { get, post, put, upload } from '@/utils/request'

export type DeletionStatus = 'none' | 'pending' | 'deleted'
export type UserRole = 'user' | 'admin' | 'super_admin'

// 用户信息接口
export interface UserInfo {
  id: number
  studentId?: string
  username: string
  avatar?: string
  creditScore: number
  isViolationUser?: boolean
  violationMarkedAt?: string | null
  violationReason?: string | null
  tradeRestrictedUntil?: string | null
  publishRestrictedUntil?: string | null
  isVerified: boolean
  status: string
  role: UserRole
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
export type LoginType = 'user' | 'admin'

export interface LoginParams {
  account: string
  password: string
  loginType: LoginType
}

export interface ChangeOwnPasswordParams {
  oldPassword: string
  newPassword: string
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

export const mockStudentVerification = async (userInfo: Partial<UserInfo>): Promise<Partial<UserInfo>> => {
  return Promise.resolve({
    ...userInfo,
    isVerified: true,
    updatedAt: new Date().toISOString()
  })
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

export const changeOwnPassword = (data: ChangeOwnPasswordParams): Promise<{ message: string }> => {
  return put('/users/password', data)
}

/**
 * 上传头像
 */
export const uploadAvatar = async (filePath: string): Promise<{ url: string }> => {
  const uploadResult = await upload<{ url: string }>('/upload/avatar', filePath, undefined, 'avatar')
  return post<{ url: string }>('/users/avatar', { avatar: uploadResult.url })
}
