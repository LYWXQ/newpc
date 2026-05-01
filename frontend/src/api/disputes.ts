/**
 * 纠纷相关 API
 */
import { get, post, put } from '@/utils/request'
import type { PaginationData } from './types'
import type { Order } from './orders'
import type { UserInfo } from './auth'

export type DisputeStatus = 'open' | 'awaiting_counterparty' | 'under_review' | 'resolved' | 'cancelled'
export type DisputeVerdict = 'borrower_responsible' | 'lender_responsible' | 'shared_responsibility' | 'no_fault'

export interface Dispute {
  id: number
  orderId: number
  itemId: number
  borrowerId: number
  lenderId: number
  initiatorId: number
  respondentId: number
  status: DisputeStatus
  initiatorStatement: string
  initiatorImages: string[]
  respondentStatement?: string | null
  respondentImages?: string[]
  adminId?: number | null
  verdict?: DisputeVerdict | null
  lossAmount?: number | string | null
  resolutionNote?: string | null
  borrowerPenaltyScore?: number | null
  lenderPenaltyScore?: number | null
  restrictionEndsAt?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
  order?: Order
  borrower?: Partial<UserInfo>
  lender?: Partial<UserInfo>
  initiator?: Partial<UserInfo>
  respondent?: Partial<UserInfo>
  admin?: Partial<UserInfo>
}

export interface CreateDisputeParams {
  statement: string
  images?: string[]
}

export interface RespondDisputeParams {
  statement: string
  images?: string[]
}

export const getOrderDispute = (orderId: number, options?: any): Promise<{ dispute: Dispute }> => {
  return get(`/orders/${orderId}/dispute`, undefined, options)
}

export const createOrderDispute = (orderId: number, data: CreateDisputeParams): Promise<{ message: string; dispute: Dispute }> => {
  return post(`/orders/${orderId}/disputes`, data)
}

export const respondDispute = (disputeId: number, data: RespondDisputeParams): Promise<{ message: string; dispute: Dispute }> => {
  return put(`/disputes/${disputeId}/respond`, data)
}

export const getMyDisputes = (): Promise<{ disputes: Dispute[] }> => {
  return get('/disputes/mine')
}

export const getMyDisputeList = (): Promise<PaginationData<Dispute>> => {
  return getMyDisputes().then((res) => ({
    disputes: res.disputes,
    pagination: {
      total: res.disputes.length,
      page: 1,
      limit: res.disputes.length,
      totalPages: 1
    }
  }))
}
