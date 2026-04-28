<template>
  <view v-if="loading" class="auth-loading">
    <view class="loading-content">
      <view class="loading-spinner"></view>
      <text class="loading-text">检查登录状态...</text>
    </view>
  </view>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { requireAuth } from '@/utils/auth'

const props = defineProps<{
  pagePath: string
}>()

const loading = ref(true)

onMounted(() => {
  // 检查登录状态
  requireAuth(props.pagePath)
  loading.value = false
})
</script>

<style lang="scss" scoped>
.auth-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #999;
}
</style>
