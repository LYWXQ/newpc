<template>
  <view class="container">
    <view class="item-card">
      <image class="item-image" :src="groupImage" mode="aspectFill" />
      <view class="item-info">
        <text class="item-title">{{ pageTitle }}</text>
        <text class="item-subtitle">共 {{ total }} 条系统消息</text>
      </view>
    </view>

    <scroll-view
      class="message-list"
      scroll-y
      :refresher-enabled="false"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view v-if="messages.length === 0 && !loading" class="empty-state">
        <text class="empty-text">暂无消息</text>
      </view>

      <view
        v-for="message in messages"
        :key="message.id"
        class="message-item"
        :class="{ unread: !message.isRead }"
        @click="handleMessageClick(message)"
      >
        <view class="message-main">
          <text class="message-text">{{ message.content }}</text>
          <text class="message-time">{{ formatTime(message.createdAt) }}</text>
        </view>
        <view class="message-side">
          <view v-if="!message.isRead" class="message-badge" />
          <view class="delete-btn" @click.stop="handleDelete(message)">
            <text class="delete-icon">🗑️</text>
          </view>
        </view>
      </view>

      <view v-if="loading && messages.length > 0" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-if="!hasMore && messages.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { onLoad, onShow } from '@dcloudio/uni-app'
  import { getMessageList, markGroupAsRead, markAsRead, deleteMessage, type Message } from '@/api/messages'
  import { getImageUrl } from '@/utils/image'
  import { syncMessageTabBadge } from '@/utils/messageBadge'

  const page = ref(1)
  const limit = ref(20)
  const hasMore = ref(true)
  const loading = ref(false)
  const refreshing = ref(false)
  const total = ref(0)
  const messages = ref<Message[]>([])
  const itemId = ref<number | undefined>()
  const groupKey = ref('others')
  const pageTitle = ref('其他通知')

  const groupImage = computed(() => {
    const firstItemImages = messages.value.find(message => message.item?.images)?.item?.images
    if (Array.isArray(firstItemImages)) {
      return getImageUrl(firstItemImages[0])
    }
    return getImageUrl(firstItemImages || null)
  })

  const fetchMessages = async (isRefresh = false) => {
    if (loading.value) return

    loading.value = true
    try {
      const params: { page: number; limit: number; type: 'system'; itemId?: number; groupKey?: string } = {
        page: isRefresh ? 1 : page.value,
        limit: limit.value,
        type: 'system',
        groupKey: groupKey.value
      }

      if (itemId.value) {
        params.itemId = itemId.value
      }

      const res = await getMessageList(params)
      const nextMessages = res.messages || []

      if (isRefresh) {
        messages.value = nextMessages
        page.value = 2
      } else {
        messages.value = [...messages.value, ...nextMessages]
        page.value++
      }

      total.value = res.pagination.total || 0
      hasMore.value = res.pagination.page < res.pagination.totalPages

      const firstMessage = messages.value[0]
      if (firstMessage?.item?.title) {
        pageTitle.value = firstMessage.item.title
      }
    } catch (error) {
      uni.showToast({ title: '获取消息失败', icon: 'none' })
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  const markCurrentGroupAsRead = async () => {
    try {
      await markGroupAsRead({ itemId: itemId.value, groupKey: groupKey.value })
      messages.value = messages.value.map(message => ({ ...message, isRead: true }))
      await syncMessageTabBadge()
    } catch (error) {
      console.error('批量已读失败', error)
    }
  }

  const onRefresh = async () => {
    refreshing.value = true
    page.value = 1
    hasMore.value = true
    await fetchMessages(true)
    await markCurrentGroupAsRead()
  }

  const onLoadMore = () => {
    if (!hasMore.value || loading.value) return
    void fetchMessages()
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  const handleMessageClick = async (message: Message) => {
    if (!message.isRead) {
      try {
        await markAsRead(message.id)
        message.isRead = true
        await syncMessageTabBadge()
      } catch (error) {
        console.error('标记已读失败', error)
      }
    }

    if (message.relatedId && message.relatedType === 'order') {
      uni.navigateTo({
        url: `/pages/order-detail/order-detail?id=${message.relatedId}`
      })
    }
  }

  const handleDelete = async (message: Message) => {
    uni.showModal({
      title: '提示',
      content: '确定删除这条消息吗？',
      success: async (res) => {
        if (!res.confirm) return

        try {
          await deleteMessage(message.id)
          messages.value = messages.value.filter(item => item.id !== message.id)
          total.value = Math.max(0, total.value - 1)
          await syncMessageTabBadge()
          uni.showToast({ title: '删除成功', icon: 'success' })
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  }

  onLoad((options) => {
    groupKey.value = options?.groupKey ? decodeURIComponent(options.groupKey) : 'others'
    const parsedItemId = options?.itemId ? Number(options.itemId) : NaN
    if (!Number.isNaN(parsedItemId) && parsedItemId > 0) {
      itemId.value = parsedItemId
    }
  })

  onShow(() => {
    void onRefresh()
  })
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background-color: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
}

.item-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  overflow: hidden;
}

.item-title {
  display: block;
  font-size: 32rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.item-subtitle {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.message-list {
  flex: 1;
  padding: 16rpx;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.message-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.message-item.unread {
  background-color: #f0f7ff;
}

.message-main {
  flex: 1;
}

.message-text {
  display: block;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  margin-bottom: 12rpx;
}

.message-time {
  display: block;
  font-size: 22rpx;
  color: #999999;
}

.message-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.message-badge {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #ff4d4f;
}

.delete-btn {
  padding: 8rpx;
}

.delete-icon {
  font-size: 30rpx;
  opacity: 0.6;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 24rpx;
  font-size: 24rpx;
  color: #999999;
}
</style>
