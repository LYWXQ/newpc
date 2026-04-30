<template>
  <view class="container">
    <view class="message-header">
      <text class="page-title">消息中心</text>
      <view class="mark-all-read" @click="handleMarkAllAsRead">
        <text class="mark-all-text">全部已读</text>
      </view>
    </view>

    <scroll-view
      class="message-list"
      scroll-y
      :refresher-enabled="false"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view v-if="messageGroups.length === 0 && !isLoading" class="empty-state">
        <text class="empty-text">暂无消息</text>
      </view>

      <view
        v-for="group in messageGroups"
        :key="group.groupKey"
        class="message-item"
        :class="{ unread: group.unreadCount > 0 }"
        @click="goToMessageDetail(group)"
        @longpress="handleLongPress(group)"
      >
        <image class="item-image" :src="getGroupImage(group)" mode="aspectFill" />
        <view class="message-content">
          <view class="message-top">
            <text class="message-title">{{ group.title }}</text>
            <text class="message-time">{{ formatTime(group.lastMessageTime) }}</text>
          </view>
          <text class="message-text">{{ group.lastMessage }}</text>
          <view class="message-meta">
            <text class="message-count">共 {{ group.totalCount }} 条消息</text>
          </view>
        </view>
        <view class="message-right">
          <view v-if="group.unreadCount > 0" class="message-badge">{{ group.unreadCount }}</view>
          <view class="delete-btn" @click.stop="handleDeleteGroup(group)">
            <text class="delete-icon">🗑️</text>
          </view>
        </view>
      </view>

      <view v-if="isLoading && messageGroups.length > 0" class="loading-more">
        <text>加载中...</text>
      </view>

      <view v-if="!hasMore && messageGroups.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getMessageGroups, markAllAsRead, markGroupAsRead, deleteMessageGroup, type MessageGroup } from '@/api/messages'
  import { syncMessageTabBadge } from '@/utils/messageBadge'
  import { getImageUrl } from '@/utils/image'

  const messageGroups = ref<MessageGroup[]>([])
  const page = ref(1)
  const limit = ref(10)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const isRefreshing = ref(false)

  const checkLoginStatus = () => {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.navigateTo({ url: '/pages/login/login' })
      return false
    }
    return true
  }

  const fetchMessageGroups = async (isRefresh = false) => {
    if (isLoading.value) return

    isLoading.value = true

    try {
      const params = {
        page: isRefresh ? 1 : page.value,
        limit: limit.value
      }

      const res = await getMessageGroups(params)
      const groups = res.groups || []

      if (isRefresh) {
        messageGroups.value = groups
        page.value = 2
      } else {
        messageGroups.value = [...messageGroups.value, ...groups]
        page.value++
      }

      hasMore.value = res.pagination.page < res.pagination.totalPages
    } catch (error) {
      uni.showToast({
        title: '获取消息失败',
        icon: 'none'
      })
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }

  const onRefresh = async () => {
    isRefreshing.value = true
    page.value = 1
    hasMore.value = true
    await fetchMessageGroups(true)
    await syncMessageTabBadge()
  }

  const onLoadMore = () => {
    if (!hasMore.value || isLoading.value) return
    void fetchMessageGroups()
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return days[date.getDay()]
    }

    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  const getGroupImage = (group: MessageGroup) => {
    const images = group.item?.images
    if (Array.isArray(images)) {
      return getImageUrl(images[0])
    }
    return getImageUrl(images || null)
  }

  const goToMessageDetail = async (group: MessageGroup) => {
    if (group.unreadCount > 0) {
      messageGroups.value = messageGroups.value.map(item => item.groupKey === group.groupKey ? {
        ...item,
        unreadCount: 0
      } : item)

      await syncMessageTabBadge()

      try {
        await markGroupAsRead({ itemId: group.itemId, groupKey: group.groupKey })
        await syncMessageTabBadge()
      } catch (error) {
        console.error('按分组标记已读失败:', error)
        await onRefresh()
      }
    }

    const params = [`groupKey=${encodeURIComponent(group.groupKey)}`]

    if (group.itemId) {
      params.push(`itemId=${group.itemId}`)
    }

    uni.navigateTo({
      url: `/pages/message-detail/message-detail?${params.join('&')}`
    })
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      messageGroups.value = messageGroups.value.map(group => ({
        ...group,
        unreadCount: 0
      }))
      await syncMessageTabBadge()
      uni.showToast({ title: '已全部标记为已读', icon: 'success' })
    } catch (error) {
      uni.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleLongPress = (group: MessageGroup) => {
    uni.showActionSheet({
      itemList: ['删除该分类消息'],
      success: (res) => {
        if (res.tapIndex === 0) {
          void handleDeleteGroup(group)
        }
      }
    })
  }

  const handleDeleteGroup = async (group: MessageGroup) => {
    uni.showModal({
      title: '提示',
      content: `确定删除“${group.title}”下的全部消息吗？`,
      success: async (res) => {
        if (!res.confirm) return

        try {
          await deleteMessageGroup({ itemId: group.itemId, groupKey: group.groupKey })
          messageGroups.value = messageGroups.value.filter(item => item.groupKey !== group.groupKey)
          await syncMessageTabBadge()
          uni.showToast({ title: '删除成功', icon: 'success' })
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  }

  onMounted(() => {
    if (checkLoginStatus()) {
      void fetchMessageGroups(true)
    }
  })

  onShow(() => {
    if (checkLoginStatus()) {
      void onRefresh()
    }
  })
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.message-header {
  background-color: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.mark-all-read {
  padding: 12rpx 24rpx;
}

.mark-all-text {
  font-size: 26rpx;
  color: #007aff;
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
  align-items: center;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  gap: 20rpx;
}

.message-item.unread {
  background-color: #f0f7ff;
}

.item-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  overflow: hidden;
}

.message-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.message-title {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #999999;
}

.message-text {
  font-size: 26rpx;
  color: #666666;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 10rpx;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.message-count {
  font-size: 22rpx;
  color: #999999;
}

.message-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 120rpx;
}

.message-badge {
  min-width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  padding: 0 10rpx;
  border-radius: 18rpx;
  background-color: #ff4d4f;
  color: #ffffff;
  font-size: 22rpx;
  text-align: center;
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
