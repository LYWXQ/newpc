import { getUnreadCount } from '@/api/messages'

const MESSAGE_TAB_INDEX = 3
const BADGE_RETRY_DELAYS = [0, 120, 320]

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

const hasH5BadgeRendered = () => {
  if (typeof document === 'undefined') return true

  return Boolean(
    document.querySelector('.uni-tabbar__item:nth-child(4) .uni-tabbar__badge')
    || document.querySelector('.uni-tabbar__item:nth-child(4) .uni-tabbar__reddot')
  )
}

const clearMessageTabBadge = () => {
  try {
    uni.removeTabBarBadge({ index: MESSAGE_TAB_INDEX })
  } catch {}

  try {
    uni.hideTabBarRedDot({ index: MESSAGE_TAB_INDEX })
  } catch {}
}

const applyMessageTabBadge = async (count: number) => {
  const text = count > 99 ? '99+' : String(count)

  for (const delay of BADGE_RETRY_DELAYS) {
    if (delay > 0) {
      await wait(delay)
    }

    try {
      await uni.setTabBarBadge({
        index: MESSAGE_TAB_INDEX,
        text
      })

      if (hasH5BadgeRendered()) {
        return
      }
    } catch {
      try {
        await uni.showTabBarRedDot({ index: MESSAGE_TAB_INDEX })
        return
      } catch {}
    }
  }
}

export const syncMessageTabBadge = async () => {
  const token = uni.getStorageSync('token')

  if (!token) {
    clearMessageTabBadge()
    return 0
  }

  try {
    const { count = 0 } = await getUnreadCount({ showLoading: false })

    if (count > 0) {
      await applyMessageTabBadge(count)
    } else {
      clearMessageTabBadge()
    }

    return count
  } catch (error) {
    console.error('同步消息红点失败:', error)
    return 0
  }
}
