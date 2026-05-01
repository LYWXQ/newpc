/**
 * 后台管理相关 API
 */
import { del, get, post, put } from '@/utils/request'
import type { PaginationData } from './types'
import type { UserInfo, UserRole } from './auth'
import type { Order } from './orders'
import type { Dispute, DisputeVerdict } from './disputes'

export interface AdminUser extends UserInfo {
  role: UserRole
}

export interface CreditRecord {
  id: number
  userId: number
  changeType: 'increase' | 'decrease'
  sourceType: 'order_completion' | 'review' | 'dispute' | 'manual_adjustment' | 'system'
  sourceId?: number | null
  delta: number
  scoreBefore: number
  scoreAfter: number
  reason?: string | null
  operatorId?: number | null
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export interface UserRestriction {
  id: number
  userId: number
  restrictionType: 'trade' | 'publish'
  sourceType: 'dispute' | 'manual' | 'credit_threshold' | 'system'
  sourceId?: number | null
  reason?: string | null
  startsAt: string
  endsAt: string
  isActive: boolean
  operatorId?: number | null
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export interface AdminActionLog {
  id: number
  adminId: number
  targetUserId?: number | null
  targetOrderId?: number | null
  targetDisputeId?: number | null
  actionType: 'create_admin' | 'deactivate_admin' | 'reactivate_admin' | 'delete_admin' | 'mark_violation' | 'apply_restriction' | 'adjust_credit' | 'resolve_dispute'
  summary: string
  detail?: string | null
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  admin?: Partial<UserInfo>
  targetUser?: Partial<UserInfo>
}

export interface AdminListResponse {
  admins: AdminUser[]
}

export interface AdminUserDetailResponse {
  user: AdminUser
  creditRecords: CreditRecord[]
  restrictions: UserRestriction[]
}

export interface UserListParams {
  page?: number
  limit?: number
  keyword?: string
  role?: 'user' | 'admin' | 'super_admin'
  status?: string
  isViolationUser?: boolean
}

export interface OrderListParams {
  page?: number
  limit?: number
  keyword?: string
  status?: string
}

export interface DisputeListParams {
  page?: number
  limit?: number
  status?: string
}

export interface ResolveDisputeParams {
  verdict: DisputeVerdict
  lossAmount?: number
  resolutionNote: string
  borrowerPenaltyScore?: number
  lenderPenaltyScore?: number
  restrictionHours?: number
}

export const getAdminList = (): Promise<AdminListResponse> => {
  return get('/admin/admins')
}

export const createAdmin = (data: { username: string; password: string; role?: 'admin' }): Promise<{ message: string; admin: AdminUser }> => {
  return post('/admin/admins', data)
}

export const deactivateAdmin = (id: number): Promise<{ message: string; admin: AdminUser }> => {
  return put(`/admin/admins/${id}/deactivate`)
}

export const reactivateAdmin = (id: number): Promise<{ message: string; admin: AdminUser }> => {
  return put(`/admin/admins/${id}/reactivate`)
}

export const deleteAdmin = (id: number): Promise<{ message: string }> => {
  return del(`/admin/admins/${id}`)
}

export const getAdminUsers = (params?: UserListParams): Promise<PaginationData<AdminUser>> => {
  return get('/admin/users', params)
}

export const getAdminUserDetail = (id: number): Promise<AdminUserDetailResponse> => {
  return get(`/admin/users/${id}`)
}

export const updateAdminUserStatus = (id: number, status: 'active' | 'inactive' | 'banned'): Promise<{ message: string; user: AdminUser }> => {
  return put(`/admin/users/${id}/status`, { status })
}

export const updateAdminUserViolation = (id: number, data: { isViolationUser: boolean; reason?: string }): Promise<{ message: string; user: AdminUser }> => {
  return put(`/admin/users/${id}/violation`, data)
}

export const createAdminUserRestriction = (id: number, data: { restrictionType: 'trade' | 'publish'; hours?: number; reason?: string }): Promise<{ message: string; restriction: UserRestriction }> => {
  return post(`/admin/users/${id}/restrictions`, data)
}

export const adjustAdminUserCredit = (id: number, data: { delta: number; reason?: string }): Promise<{ message: string; record: CreditRecord }> => {
  return post(`/admin/users/${id}/credit-adjustments`, data)
}

export const updateAdminUserPassword = (id: number, data: { newPassword: string; oldPassword?: string }): Promise<{ message: string }> => {
  return put(`/admin/users/${id}/password`, data)
}

export const getAdminOrders = (params?: OrderListParams): Promise<PaginationData<Order>> => {
  return get('/admin/orders', params)
}

export const getAdminOrderDetail = (id: number): Promise<{ order: Order & { dispute?: Dispute | null } }> => {
  return get(`/admin/orders/${id}`)
}

export const getAdminDisputes = (params?: DisputeListParams): Promise<PaginationData<Dispute>> => {
  return get('/admin/disputes', params)
}

export const getAdminDisputeDetail = (id: number): Promise<{ dispute: Dispute }> => {
  return get(`/admin/disputes/${id}`)
}

export const resolveAdminDispute = (id: number, data: ResolveDisputeParams): Promise<{ message: string; dispute: Dispute }> => {
  return post(`/admin/disputes/${id}/resolve`, data)
}

export const getAdminLogs = (): Promise<{ logs: AdminActionLog[] }> => {
  return get('/admin/logs')
}
