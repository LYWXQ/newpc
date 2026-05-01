<template>
  <view class="page">
    <view class="hero-card">
      <text class="hero-title">后台工作台</text>
      <text class="hero-subtitle">欢迎，{{ authStore.userInfo.username || '管理员' }}</text>
      <view class="hero-tags">
        <text class="hero-tag">角色：{{ roleLabel }}</text>
      </view>
    </view>

    <view class="grid">
      <view class="entry-card" @click="go('/pages/admin/user-list')">
        <text class="entry-title">用户管理</text>
        <text class="entry-desc">查看用户、违规状态、限制与信用分</text>
      </view>
      <view class="entry-card" @click="go('/pages/admin/order-list')">
        <text class="entry-title">订单管理</text>
        <text class="entry-desc">搜索订单并查看交易详情</text>
      </view>
      <view class="entry-card" @click="go('/pages/admin/dispute-list')">
        <text class="entry-title">纠纷管理</text>
        <text class="entry-desc">处理用户纠纷并执行处罚</text>
      </view>
      <view v-if="authStore.isSuperAdmin" class="entry-card" @click="go('/pages/admin/admin-list')">
        <text class="entry-title">管理员管理</text>
        <text class="entry-desc">创建、停用、恢复、注销管理员</text>
      </view>
    </view>

    <view class="action-card">
      <button class="secondary-btn" @click="go('/pages/dispute/list')">查看普通用户纠纷页</button>
      <button class="danger-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const roleLabel = computed(() => authStore.role === 'super_admin' ? '超级管理员' : '管理员')

onMounted(() => {
  if (!authStore.isLoggedIn || !authStore.isAdmin) {
    uni.redirectTo({ url: '/pages/login/login' })
  }
})

const go = (url: string) => {
  uni.navigateTo({ url })
}

const handleLogout = async () => {
  await authStore.logout()
  uni.reLaunch({ url: '/pages/login/login' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.hero-card,
.entry-card,
.action-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.06);
}

.hero-card {
  margin-bottom: 20rpx;
}

.hero-title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2937;
}

.hero-subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #64748b;
}

.hero-tags {
  margin-top: 20rpx;
}

.hero-tag {
  display: inline-block;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #eaf3ff;
  color: #007aff;
  font-size: 24rpx;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.entry-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

.entry-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.6;
}

.action-card {
  margin-top: 20rpx;
}

.secondary-btn,
.danger-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  font-size: 28rpx;
  margin-top: 16rpx;
}

.secondary-btn {
  background: #007aff;
  color: #fff;
}

.danger-btn {
  background: #fff1f0;
  color: #ff4d4f;
}
</style>
