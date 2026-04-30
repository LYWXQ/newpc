<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { getCurrentUser } from '@/api/auth'
import { initDeviceInfo } from '@/utils/device'

onLaunch(async () => {
  // 初始化设备信息
  await initDeviceInfo()
  
  const authStore = useAuthStore()
  authStore.initAuth()

  if (authStore.isLoggedIn && authStore.token) {
    try {
      const userInfo = await getCurrentUser()
      authStore.updateUserInfo(userInfo)
    } catch (error) {
      console.error('获取最新用户信息失败:', error)
    }
  }
})

onShow(() => {})

onHide(() => {})
</script>

<style lang="scss">
@import './uni.scss';

page {
  background-color: $bg-color;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: $font-base;
  color: $text-primary;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

view, text {
  box-sizing: border-box;
}

image {
  display: block;
}

button {
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  line-height: inherit;
  
  &::after {
    border: none;
  }
}

.page-container {
  min-height: 100vh;
  background-color: $bg-color;
}

.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}
</style>