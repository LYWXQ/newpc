<template>
  <view class="profile-container">
    <view class="user-card">
      <view class="user-info">
        <image class="avatar" :src="getImageUrl(authStore.userInfo.avatar)" mode="aspectFill" />
        <view class="user-detail">
          <text class="nickname">{{ authStore.userInfo.username || '未登录' }}</text>
          <text class="student-id">学号: {{ authStore.userInfo.studentId || '--' }}</text>
          <view class="info-tags">
            <view class="credit-tag">
              <text class="credit-label">信用分</text>
              <text class="credit-score">{{ authStore.userInfo.creditScore || 100 }}</text>
            </view>
            <view
              class="verify-tag"
              :class="authStore.userInfo.isVerified ? 'verified' : 'unverified'"
              @click="handleVerifyClick"
            >
              <text class="verify-text">{{ authStore.userInfo.isVerified ? '已认证' : '未认证' }}</text>
            </view>
          </view>
          <view class="school-info" v-if="authStore.userInfo.school || authStore.userInfo.major">
            <text class="school-text" v-if="authStore.userInfo.school">🏫 {{ authStore.userInfo.school }}</text>
            <text class="major-text" v-if="authStore.userInfo.major">📚 {{ authStore.userInfo.major }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="stats-grid" v-if="authStore.isLoggedIn">
      <view class="stat-item" @click="goToOrders('lender')">
        <text class="stat-num">{{ dashboard.totalAsLender }}</text>
        <text class="stat-label">我借出的</text>
      </view>
      <view class="stat-item" @click="goToOrders('borrower')">
        <text class="stat-num">{{ dashboard.totalAsBorrower }}</text>
        <text class="stat-label">我借入的</text>
      </view>
      <view class="stat-item" @click="goToOrders('borrower')">
        <text class="stat-num">{{ dashboard.pendingCount }}</text>
        <text class="stat-label">待处理</text>
      </view>
      <view class="stat-item" @click="goToOrders('borrower')">
        <text class="stat-num">{{ dashboard.completedCount }}</text>
        <text class="stat-label">已完成</text>
      </view>
      <view class="stat-item" @click="goToMessages">
        <text class="stat-num">{{ dashboard.unreadCount }}</text>
        <text class="stat-label">未读消息</text>
      </view>
    </view>

    <view class="menu-list" v-if="authStore.isLoggedIn">
      <view class="menu-item" @click="goToMyItems">
        <text class="menu-icon">📦</text>
        <text class="menu-text">我的发布</text>
        <view class="menu-meta">
          <text class="menu-count" v-if="dashboard.publishedCount > 0">{{ dashboard.publishedCount }}</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
      <view class="menu-item" @click="goToOrders()">
        <text class="menu-icon">📋</text>
        <text class="menu-text">我的订单</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goToMessages">
        <text class="menu-icon">💬</text>
        <text class="menu-text">我的消息</text>
        <view class="menu-meta">
          <view class="badge" v-if="dashboard.unreadCount > 0">{{ dashboard.unreadCount }}</view>
          <text class="menu-arrow">></text>
        </view>
      </view>
      <view class="menu-item" @click="goToReviews">
        <text class="menu-icon">⭐</text>
        <text class="menu-text">我的评价</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goToFavorites">
        <text class="menu-icon">❤️</text>
        <text class="menu-text">我的收藏</text>
        <view class="menu-meta">
          <text class="menu-count" v-if="dashboard.favoriteCount > 0">{{ dashboard.favoriteCount }}</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
      <view class="menu-item" @click="goToSettings">
        <text class="menu-icon">⚙️</text>
        <text class="menu-text">设置</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <button class="login-btn" @click="goToLogin" v-else>
      立即登录
    </button>
  </view>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getCurrentUser } from '@/api/auth'
  import { getMyItemsCount } from '@/api/items'
  import { getUnreadCount } from '@/api/messages'
  import { getOrderStats } from '@/api/orders'
  import { getFavoriteCount } from '@/api/favorites'
  import { useAuthStore } from '@/stores/auth'
  import { checkLogin } from '@/utils/auth'
  import { getImageUrl } from '@/utils/image'

  const authStore = useAuthStore()

  const createDashboard = () => ({
    totalAsLender: 0,
    totalAsBorrower: 0,
    pendingCount: 0,
    completedCount: 0,
    unreadCount: 0,
    publishedCount: 0,
    favoriteCount: 0
  })

  const dashboard = ref(createDashboard())

  onMounted(() => {
    checkLoginStatus()
  })

  onShow(() => {
    checkLoginStatus()
  })

  const resetDashboard = () => {
    dashboard.value = createDashboard()
  }

  const checkLoginStatus = () => {
    if (!authStore.isLoggedIn) {
      resetDashboard()
      return
    }

    loadUserInfo()
    loadDashboardData()
  }

  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser(undefined, { showLoading: false })
      authStore.updateUserInfo(user)
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const loadDashboardData = async () => {
    const [orderStats, unreadInfo, publishedInfo, favoriteInfo] = await Promise.all([
      getOrderStats({ showLoading: false }).catch(() => null),
      getUnreadCount({ showLoading: false }).catch(() => null),
      getMyItemsCount().catch(() => null),
      getFavoriteCount().catch(() => null)
    ])

    if (orderStats) {
      dashboard.value.totalAsLender = orderStats.totalAsLender || 0
      dashboard.value.totalAsBorrower = orderStats.totalAsBorrower || 0
      dashboard.value.pendingCount = orderStats.pendingCount || 0
      dashboard.value.completedCount = orderStats.completedCount || 0
    }

    if (unreadInfo) {
      dashboard.value.unreadCount = unreadInfo.count || 0
    }

    if (publishedInfo) {
      dashboard.value.publishedCount = publishedInfo.total || 0
    }

    if (favoriteInfo) {
      dashboard.value.favoriteCount = favoriteInfo.count || 0
    }
  }

  const goToMyItems = () => {
    if (!checkLogin()) return
    uni.navigateTo({ url: '/pages/my-items/my-items' })
  }

  const goToOrders = (role: 'lender' | 'borrower' = 'borrower') => {
    if (!checkLogin()) return
    uni.setStorageSync('orderRole', role)
    uni.switchTab({ url: '/pages/orders/orders' })
  }

  const goToMessages = () => {
    if (!checkLogin()) return
    uni.switchTab({ url: '/pages/messages/messages' })
  }

  const goToReviews = () => {
    if (!checkLogin()) return
    uni.navigateTo({ url: '/pages/reviews/reviews' })
  }

  const goToFavorites = () => {
    if (!checkLogin()) return
    uni.navigateTo({ url: '/pages/favorites/favorites' })
  }

  const goToSettings = () => {
    if (!checkLogin()) return
    uni.navigateTo({ url: '/pages/settings/settings' })
  }

  const goToLogin = () => {
    uni.navigateTo({ url: '/pages/login/login' })
  }

  const handleVerifyClick = () => {
    if (authStore.userInfo.isVerified) {
      uni.showToast({ title: '您已通过认证', icon: 'success' })
      return
    }

    uni.showToast({ title: '认证功能即将上线，敬请期待', icon: 'none' })
  }
</script>

<style lang="scss">
.profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx 40rpx;
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.3);
  margin-right: 30rpx;
}

.user-detail {
  flex: 1;
}

.nickname {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.student-id {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
  display: block;
  margin-bottom: 16rpx;
}

.info-tags {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.credit-tag {
  display: inline-flex;
  align-items: center;
  background-color: rgba(255,255,255,0.2);
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
}

.credit-label {
  font-size: 22rpx;
  color: rgba(255,255,255,0.9);
  margin-right: 8rpx;
}

.credit-score {
  font-size: 26rpx;
  font-weight: bold;
  color: #52c41a;
}

.verify-tag {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
}

.verify-tag.verified {
  background-color: rgba(82, 196, 26, 0.2);
}

.verify-tag.unverified {
  background-color: rgba(150, 150, 150, 0.2);
}

.verify-text {
  font-size: 22rpx;
  font-weight: 500;
}

.verify-tag.verified .verify-text {
  color: #52c41a;
}

.verify-tag.unverified .verify-text {
  color: #bfbfbf;
}

.school-info {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.school-text,
.major-text {
  font-size: 24rpx;
  color: rgba(255,255,255,0.9);
}

.profile-tip-card {
  margin: -20rpx 40rpx 24rpx;
  background: rgba(255,255,255,0.95);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  position: relative;
  z-index: 1;
}

.profile-tip {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.stats-grid {
  display: flex;
  background-color: #fff;
  margin: 0 40rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1rpx solid #f0f0f0;
}

.stat-item:last-child {
  border-right: none;
}

.stat-num {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
}

.menu-list {
  background-color: #fff;
  margin: 0 40rpx 30rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-meta {
  display: flex;
  align-items: center;
}

.menu-count {
  font-size: 24rpx;
  color: #999;
  margin-right: 12rpx;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}

.badge {
  background-color: #ff4d4f;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-right: 12rpx;
  min-width: 36rpx;
  text-align: center;
}

.login-btn {
  margin: 60rpx 40rpx 0;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.login-btn::after {
  border: none;
}
</style>
