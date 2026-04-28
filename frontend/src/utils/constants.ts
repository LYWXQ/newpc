export const ITEM_STATUS = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  REVIEWING: 'reviewing',
  OFFLINE: 'offline'
} as const

export const ITEM_STATUS_TEXT: Record<string, string> = {
  [ITEM_STATUS.AVAILABLE]: '可借用',
  [ITEM_STATUS.RENTED]: '已借出',
  [ITEM_STATUS.REVIEWING]: '审核中',
  [ITEM_STATUS.OFFLINE]: '已下架'
}

export const BORROW_BUTTON_TEXT: Record<string, string> = {
  [ITEM_STATUS.AVAILABLE]: '立即借用',
  [ITEM_STATUS.RENTED]: '已被借用',
  [ITEM_STATUS.REVIEWING]: '审核中',
  [ITEM_STATUS.OFFLINE]: '已下架'
}

export const formatItemStatus = (status: string): string => {
  return ITEM_STATUS_TEXT[status] || status
}

export const getBorrowButtonText = (status: string): string => {
  return BORROW_BUTTON_TEXT[status] || '立即借用'
}

export const canBorrow = (status: string): boolean => {
  return status === ITEM_STATUS.AVAILABLE
}
