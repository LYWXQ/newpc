<template>
  <view class="container">
    <view class="message-header">
      <text class="page-title">系统通知</text>
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
      <view v-if="systemMessageList.length === 0 && !isLoading" class="empty-state">
        <text class="empty-text">暂无系统通知</text>
      </view>
      
      <!-- 系统消息列表 -->
      <view 
        v-for="message in systemMessageList" 
        :key="message.id"
        class="message-item"
        :class="{ unread: !message.isRead }"
        @click="handleSystemMessageClick(message)"
        @longpress="handleLongPress(message)"
      >
        <view class="message-icon system">
          <text class="icon">📢</text>
        </view>
        <view class="message-content">
          <text class="message-title">系统通知</text>
          <text class="message-text">{{ message.content }}</text>
          <text class="message-time">{{ formatTime(message.createdAt) }}</text>
        </view>
        <view v-if="!message.isRead" class="message-badge"/>
        <view class="delete-btn" @click.stop="handleDelete(message)">
          <text class="delete-icon">🗑️</text>
        </view>
      </view>
      
      <view v-if="isLoading && systemMessageList.length > 0" class="loading-more">
        <text>加载中...</text>
      </view>
      
      <view v-if="!hasMore && systemMessageList.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getMessageList, markAsRead, markAllAsRead, deleteMessage, type Message } from '@/api/messages'

  // 系统消息列表
  const systemMessageList = ref<Message[]>([])

  // 分页参数
  const page = ref(1)
  const limit = ref(10)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const isRefreshing = ref(false)

  // 获取消息列表
  const fetchMessageList = async (isRefresh = false) => {
    if (isLoading.value) return
  
    isLoading.value = true
  
    try {
      const params: { page: number; limit: number; type: 'system' } = {
        page: isRefresh ? 1 : page.value,
        limit: limit.value,
        type: 'system'
      }
    
      const res = await getMessageList(params)
      const resData = res.messages || []
    
      // 系统消息
      if (isRefresh) {
        systemMessageList.value = resData as Message[]
        page.value = 2
      } else {
        systemMessageList.value = [...systemMessageList.value, ...(resData as Message[])]
        page.value++
      }
    
      // 判断是否还有更多数据
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

  // 下拉刷新
  const onRefresh = () => {
    isRefreshing.value = true
    page.value = 1
    hasMore.value = true
    fetchMessageList(true)
  }

  // 加载更多
  const onLoadMore = () => {
    if (!hasMore.value || isLoading.value) return
    fetchMessageList()
  }

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
  
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
  
    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    }
  
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return days[date.getDay()]
    }
  
    // 更早
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  // 点击系统消息
  const handleSystemMessageClick = async (message: Message) => {
    // 标记为已读
    if (!message.isRead) {
      try {
        await markAsRead(message.id)
        message.isRead = true
      } catch (error) {
        console.error('标记已读失败', error)
      }
    }
  
    // 系统通知，如果有相关订单则跳转到订单详情
    if (message.relatedId && message.relatedType === 'order') {
      uni.navigateTo({
        url: `/pages/order-detail/order-detail?id=${message.relatedId}`
      })
    }
  }

  // 标记全部已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      // 更新本地状态
      systemMessageList.value.forEach(msg => {
        msg.isRead = true
      })
      uni.showToast({
        title: '已全部标记为已读',
        icon: 'success'
      })
    } catch (error) {
      uni.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  // 长按消息
  const handleLongPress = (message: Message) => {
    uni.showActionSheet({
      itemList: ['删除消息'],
      success: (res) => {
        if (res.tapIndex === 0) {
          handleDelete(message)
        }
      }
    })
  }

  // 删除消息
  const handleDelete = async (message: Message) => {
    uni.showModal({
      title: '提示',
      content: '确定删除这条消息吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteMessage(message.id)
            // 从列表中移除
            const index = systemMessageList.value.findIndex(m => m.id === message.id)
            if (index > -1) {
              systemMessageList.value.splice(index, 1)
            }
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
          } catch (error) {
            uni.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  // 检查登录状态
  const checkLoginStatus = () => {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.navigateTo({ url: '/pages/login/login' })
      return false
    }
    return true
  }

  // 页面加载时获取消息列表
  onMounted(() => {
    if (checkLoginStatus()) {
      fetchMessageList(true)
    }
  })

  // 页面显示时重新加载数据
  onShow(() => {
    if (checkLoginStatus()) {
      fetchMessageList(true)
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

/* 系统消息样式 */
.message-item {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  position: relative;
}

.message-item.unread {
  background-color: #f0f7ff;
}

.message-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.message-icon.system {
  background-color: #e3f2fd;
}

.icon {
  font-size: 40rpx;
}

.message-content {
  flex: 1;
  overflow: hidden;
}

.message-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  display: block;
  color: #333333;
}

.message-text {
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 8rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 20rpx;
  color: #999999;
  display: block;
}

.message-badge {
  width: 16rpx;
  height: 16rpx;
  background-color: #ff4d4f;
  border-radius: 50%;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.delete-btn {
  padding: 16rpx;
  margin-left: 8rpx;
  flex-shrink: 0;
}

.delete-icon {
  font-size: 32rpx;
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