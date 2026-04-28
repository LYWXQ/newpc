<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image class="avatar" :src="authStore.userInfo.avatar || '/static/logo.png'" mode="aspectFill" />
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
            <text class="school-text" v-if="authStore.userInfo.school">
              🏫 {{ authStore.userInfo.school }}
            </text>
            <text class="major-text" v-if="authStore.userInfo.major">
              📚 {{ authStore.userInfo.major }}
            </text>
          </view>
        </view>
      </view>
      <view class="edit-btn" @click="editProfile">
        <text class="edit-text">编辑资料</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-grid">
      <view class="stat-item" @click="goToOrders('lender')">
        <text class="stat-num">{{ stats.items }}</text>
        <text class="stat-label">我借出的</text>
      </view>
      <view class="stat-item" @click="goToOrders('borrower')">
        <text class="stat-num">{{ stats.orders }}</text>
        <text class="stat-label">我借入的</text>
      </view>
      <view class="stat-item" @click="goToOrders('borrower')">
        <text class="stat-num">{{ stats.pending }}</text>
        <text class="stat-label">待处理</text>
      </view>
      <view class="stat-item" @click="goToMessages">
        <text class="stat-num">{{ stats.messages }}</text>
        <text class="stat-label">未读消息</text>
      </view>
      <view class="stat-item" @click="goToMyItems">
        <text class="stat-num">{{ stats.published }}</text>
        <text class="stat-label">我发布的</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToMyItems">
        <text class="menu-icon">📦</text>
        <text class="menu-text">我的发布</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goToOrders">
        <text class="menu-icon">📋</text>
        <text class="menu-text">我的订单</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goToMessages">
        <text class="menu-icon">💬</text>
        <text class="menu-text">我的消息</text>
        <view class="badge" v-if="stats.messages > 0">{{ stats.messages }}</view>
        <text class="menu-arrow" v-else>></text>
      </view>
      <view class="menu-item" @click="goToReviews">
        <text class="menu-icon">⭐</text>
        <text class="menu-text">我的评价</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goToFavorites">
        <text class="menu-icon">❤️</text>
        <text class="menu-text">我的收藏</text>
        <view class="badge" v-if="stats.favorites > 0">{{ stats.favorites }}</view>
        <text class="menu-arrow" v-else>></text>
      </view>
      <view class="menu-item" @click="goToSettings">
        <text class="menu-icon">⚙️</text>
        <text class="menu-text">设置</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- 退出登录 -->
    <button class="logout-btn" @click="handleLogout" v-if="authStore.isLoggedIn">
      退出登录
    </button>
    <button class="login-btn" @click="goToLogin" v-else>
      立即登录
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, type UserInfo } from '@/api/auth'
import { getOrderStats } from '@/api/orders'
import { getUnreadCount } from '@/api/messages'
import { getMyItemsCount } from '@/api/items'
import { getFavoriteCount } from '@/api/favorites'
import { useAuthStore } from '@/stores/auth'
import { checkLogin } from '@/utils/auth'

const authStore = useAuthStore()

const stats = ref({
  items: 0,
  orders: 0,
  pending: 0,
  messages: 0,
  published: 0,
  favorites: 0
})

onMounted(() => {
  checkLoginStatus()
})

onShow(() => {
  checkLoginStatus()
})

const checkLoginStatus = () => {
  if (authStore.isLoggedIn) {
    // 从服务器加载最新信息
    loadUserInfo()
    loadStats()
    loadUnreadCount()
    loadPublishedCount()
    loadFavoriteCount()
  } else {
    stats.value = {
      items: 0,
      orders: 0,
      pending: 0,
      messages: 0,
      published: 0,
      favorites: 0
    }
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const user = await getCurrentUser(undefined, { showLoading: false })
    authStore.updateUserInfo(user)
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 加载订单统计
const loadStats = async () => {
  try {
    const orderStats = await getOrderStats({ showLoading: false })
    stats.value.items = orderStats.totalAsLender
    stats.value.orders = orderStats.totalAsBorrower
    stats.value.pending = orderStats.pendingCount
  } catch (error) {
    console.error('获取订单统计失败:', error)
  }
}

// 加载未读消息数
const loadUnreadCount = async () => {
  try {
    const { count } = await getUnreadCount({ showLoading: false })
    stats.value.messages = count
  } catch (error) {
    console.error('获取未读消息数失败:', error)
  }
}

// 加载用户发布物品数量
const loadPublishedCount = async () => {
  try {
    const { total } = await getMyItemsCount()
    stats.value.published = total
  } catch (error) {
    console.error('获取发布物品数失败:', error)
  }
}

// 加载收藏数量
const loadFavoriteCount = async () => {
  try {
    const { count } = await getFavoriteCount()
    stats.value.favorites = count
  } catch (error) {
    console.error('获取收藏数量失败:', error)
  }
}

const editProfile = () => {
  if (!checkLogin()) return
  uni.navigateTo({ url: '/pages/edit-profile/edit-profile' })
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
  if (!checkLogin()) return
  if (authStore.userInfo.isVerified) {
    uni.showToast({ title: '您已通过认证', icon: 'success' })
    return
  }
  uni.showToast({ title: '认证功能即将上线，敬请期待', icon: 'none' })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        authStore.logout()
        stats.value = {
          items: 0,
          orders: 0,
          pending: 0,
          messages: 0,
          published: 0,
          favorites: 0
        }
        uni.showToast({ 
          title: '已退出登录', 
          icon: 'success',
          duration: 1500 
        })
        setTimeout(() => {
          uni.reLaunch({ 
            url: '/pages/login/login' 
          })
        }, 1000)
      }
    }
  })
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

.edit-btn {
  position: absolute;
  top: 40rpx;
  right: 40rpx;
  background-color: rgba(255,255,255,0.2);
  padding: 12rpx 24rpx;
  border-radius: 28rpx;
}

.edit-text {
  font-size: 24rpx;
  color: #fff;
}

.stats-grid {
  display: flex;
  background-color: #fff;
  margin: -30rpx 40rpx 30rpx;
  border-radius: 16rpx;
  padding: 30rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
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
  font-size: 36rpx;
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
  margin-right: 16rpx;
}

.logout-btn,
.login-btn {
  margin: 60rpx 40rpx 0;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
}

.logout-btn {
  background-color: #fff;
  color: #ff4d4f;
  border: 1rpx solid #ff4d4f;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.logout-btn::after,
.login-btn::after {
  border: none;
}
</style>
