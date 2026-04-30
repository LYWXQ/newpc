<template>
  <view class="settings-container">
    <view class="section-card">
      <text class="section-title">账号设置</text>
      <view class="menu-item" @click="goToEditProfile">
        <text class="menu-text">编辑资料</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="handleLogout">
        <text class="menu-text">退出登录</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <view class="section-card danger-card">
      <text class="section-title">账号注销</text>
      <view v-if="isPendingDeletion" class="deletion-status">
        <text class="status-text">账号已提交注销申请</text>
        <text class="status-tip">在 {{ deletionDeadlineText }} 前重新登录并选择继续登录，可取消注销。</text>
      </view>
      <view v-else class="deletion-status">
        <text class="status-text">申请注销后，7天内重新登录可取消注销。</text>
        <text class="status-tip">注销前不能存在进行中的订单或借还业务。</text>
      </view>
      <button class="danger-btn" :disabled="isPendingDeletion || loading" @click="handleRequestDeletion">
        {{ isPendingDeletion ? '注销申请处理中' : '申请注销' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getCurrentUser, requestAccountDeletion } from '@/api/auth'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const loading = ref(false)

  const isPendingDeletion = computed(() => authStore.userInfo.deletionStatus === 'pending')
  const deletionDeadlineText = computed(() => {
    if (!authStore.userInfo.deletionDeadlineAt) {
      return '--'
    }
    return new Date(authStore.userInfo.deletionDeadlineAt).toLocaleString('zh-CN')
  })

  const refreshUserInfo = async () => {
    try {
      const user = await getCurrentUser(undefined, { showLoading: false })
      authStore.updateUserInfo(user)
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  onShow(() => {
    refreshUserInfo()
  })

  const goToEditProfile = () => {
    uni.navigateTo({ url: '/pages/edit-profile/edit-profile' })
  }

  const handleLogout = () => {
    uni.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (!res.confirm) return
        authStore.logout()
        uni.showToast({ title: '已退出登录', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/login' })
        }, 800)
      }
    })
  }

  const handleRequestDeletion = () => {
    uni.showModal({
      title: '申请注销',
      content: '账号注销申请提交后，将进入7天冷静期。确认继续吗？',
      success: async (res) => {
        if (!res.confirm) return

        try {
          loading.value = true
          const result = await requestAccountDeletion()
          authStore.updateUserInfo({
            deletionStatus: result.deletionStatus,
            deletionRequestedAt: result.deletionRequestedAt,
            deletionDeadlineAt: result.deletionDeadlineAt
          })
          uni.showToast({ title: '注销申请已提交', icon: 'success' })
        } catch (error: any) {
          uni.showToast({ title: error.message || '申请注销失败', icon: 'none', duration: 2500 })
        } finally {
          loading.value = false
        }
      }
    })
  }
</script>

<style lang="scss">
.settings-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

.section-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 24rpx;
}

.danger-card {
  border: 1rpx solid rgba(255, 77, 79, 0.15);
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-text {
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}

.deletion-status {
  margin-bottom: 24rpx;
}

.status-text {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.status-tip {
  display: block;
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

.danger-btn {
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 30rpx;
}

.danger-btn[disabled] {
  opacity: 0.6;
}

.danger-btn::after {
  border: none;
}
</style>
