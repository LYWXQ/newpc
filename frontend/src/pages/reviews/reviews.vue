<template>
  <view class="reviews-container">
    <view class="role-tabs">
      <view 
        class="role-tab" 
        :class="{ active: currentType === 'received' }"
        @click="selectType('received')"
      >
        收到的评价
      </view>
      <view 
        class="role-tab" 
        :class="{ active: currentType === 'given' }"
        @click="selectType('given')"
      >
        发出的评价
      </view>
    </view>

    <scroll-view 
      class="reviews-scroll" 
      scroll-y 
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="review-list">
        <view class="review-card" v-for="review in reviews" :key="review.id">
          <view class="review-header">
            <image class="user-avatar" :src="getUserAvatar(review)" mode="aspectFill" />
            <view class="user-info">
              <text class="username">{{ getUsername(review) }}</text>
              <view class="rating">
                <text 
                  class="star" 
                  v-for="index in 5" 
                  :key="index"
                  :class="{ active: index <= review.rating }"
                >★</text>
              </view>
            </view>
            <text class="review-time">{{ formatTime(review.createdAt) }}</text>
          </view>
          
          <view class="item-info" v-if="review.order?.item">
            <image class="item-image" :src="review.order.item.images?.[0] || '/static/logo.png'" mode="aspectFill" />
            <text class="item-title">{{ review.order.item.title }}</text>
          </view>
          
          <text class="review-content">{{ review.content }}</text>
          
          <view class="review-images" v-if="review.images && review.images.length > 0">
            <image 
              class="review-image" 
              v-for="(img, index) in review.images" 
              :key="index"
              :src="img" 
              mode="aspectFill"
              @click="previewImage(img)"
            ></image>
          </view>
        </view>
      </view>

      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && reviews.length > 0">
        <text>没有更多了</text>
      </view>
      <view class="empty" v-if="reviews.length === 0 && !loading">
        <image class="empty-icon" src="/static/logo.png" />
        <text class="empty-text">暂无评价</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getUserReviews, type Review } from '@/api/reviews'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.userInfo?.id || 0)

const currentType = ref<'received' | 'given'>('received')
const reviews = ref<Review[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const page = ref(1)
const limit = 10

onMounted(() => {
  loadReviews()
})

const loadReviews = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    const res = await getUserReviews(currentUserId.value, {
      page: page.value,
      limit: limit,
      type: currentType.value
    })
    
    if (page.value === 1) {
      reviews.value = res.data || []
    } else {
      reviews.value = [...reviews.value, ...(res.data || [])]
    }
    
    hasMore.value = (res.data?.length || 0) === limit && page.value < (res.totalPages || 1)
  } catch (error) {
    console.error('获取评价列表失败:', error)
    uni.showToast({ title: '获取评价失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const selectType = (type: 'received' | 'given') => {
  currentType.value = type
  page.value = 1
  reviews.value = []
  hasMore.value = true
  loadReviews()
}

const getUserAvatar = (review: Review) => {
  const user = currentType.value === 'received' ? review.reviewer : review.reviewee
  return user?.avatar || '/static/logo.png'
}

const getUsername = (review: Review) => {
  const user = currentType.value === 'received' ? review.reviewer : review.reviewee
  return user?.username || '未知用户'
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

const previewImage = (url: string) => {
  uni.previewImage({
    urls: [url],
    current: url
  })
}

const loadMore = () => {
  if (!hasMore.value || loading.value) return
  
  page.value++
  loadReviews()
}

const onRefresh = async () => {
  refreshing.value = true
  page.value = 1
  hasMore.value = true
  
  await loadReviews()
  
  refreshing.value = false
}
</script>

<style lang="scss">
.reviews-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.role-tabs {
  display: flex;
  background-color: #fff;
  padding: 0 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.role-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.role-tab.active {
  color: #007aff;
  font-weight: 500;
}

.role-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #007aff;
  border-radius: 2rpx;
}

.reviews-scroll {
  flex: 1;
  padding: 20rpx;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.review-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.user-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 4rpx;
}

.rating {
  display: flex;
}

.rating .star {
  font-size: 24rpx;
  color: #ddd;
  margin-right: 2rpx;
}

.rating .star.active {
  color: #ffb800;
}

.review-time {
  font-size: 24rpx;
  color: #999;
}

.item-info {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.item-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
}

.item-title {
  font-size: 26rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: block;
  margin-bottom: 16rpx;
}

.review-images {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.review-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
}

.load-more,
.no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
}
</style>
