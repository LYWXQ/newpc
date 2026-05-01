<template>
  <view class="login-container">
    <view class="login-header">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">校园闲置共享</text>
      <text class="subtitle">让闲置物品流动起来</text>
    </view>

    <view class="login-form">
      <view class="login-tabs">
        <view class="login-tab" :class="{ active: loginType === 'user' }" @click="switchLoginType('user')">普通用户登录</view>
        <view class="login-tab" :class="{ active: loginType === 'admin' }" @click="switchLoginType('admin')">后台登录</view>
      </view>

      <view class="form-item">
        <text class="label">{{ loginType === 'user' ? '学号/手机号' : '管理员账号' }}</text>
        <input
          type="text"
          v-model="account"
          name="account"
          :placeholder="loginType === 'user' ? '请输入学号或手机号' : '请输入管理员账号'"
          maxlength="50"
        >
      </view>

      <view class="form-item">
        <text class="label">密码</text>
        <input
          type="password"
          v-model="password"
          name="password"
          placeholder="请输入密码"
          maxlength="20"
        >
      </view>

      <button class="login-btn"
              @click="handleLogin"
              :loading="loading"
              :disabled="loading">
        登录
      </button>

      <view class="form-footer">
        <text v-if="loginType === 'user'" class="link" @click="goToRegister">还没有账号？去注册</text>
        <text v-else class="link hint">后台账号仅限管理员和超级管理员</text>
        <text class="link" @click="goToForgot">忘记密码？</text>
      </view>
    </view>

    <view class="login-footer">
      <text class="tips">登录即表示您同意</text>
      <text class="agreement" @click="showAgreement">《用户协议》</text>
      <text class="tips">和</text>
      <text class="agreement" @click="showPrivacy">《隐私政策》</text>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { login, resolveDeletionLogin, type LoginResponse, type LoginSuccessResponse, type LoginType, type PendingDeletionLoginResponse, type UserInfo } from '@/api/auth'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const loginType = ref<LoginType>('user')
  const account = ref('')
  const password = ref('')
  const loading = ref(false)

  const isPendingDeletionResponse = (response: LoginResponse): response is PendingDeletionLoginResponse => {
    return 'actionRequired' in response && response.actionRequired === 'confirmDeletionLogin'
  }

  const isLoginSuccessResponse = (response: LoginResponse): response is LoginSuccessResponse => {
    return 'token' in response && 'user' in response
  }

  const completeLogin = (token: string, user: UserInfo) => {
    authStore.login(token, user)

    uni.showToast({ title: '登录成功', icon: 'success' })

    setTimeout(() => {
      if (user.role === 'admin' || user.role === 'super_admin') {
        uni.navigateTo({ url: '/pages/admin/dashboard' })
        return
      }

      const redirectPath = uni.getStorageSync('redirectPath') || ''
      if (redirectPath && redirectPath !== '/pages/login/login' && redirectPath !== '/pages/register/register') {
        uni.removeStorageSync('redirectPath')
        uni.redirectTo({ url: redirectPath })
        return
      }

      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  }

  const handlePendingDeletionLogin = async (response: PendingDeletionLoginResponse) => {
    return new Promise<void>((resolve, reject) => {
      uni.showModal({
        title: '账号注销确认',
        content: '该账号仍在7天注销冷静期内。继续登录将取消注销申请；中断登录则账号继续按原计划注销。',
        confirmText: '继续登录',
        cancelText: '中断登录',
        success: async (modalRes) => {
          try {
            const result = await resolveDeletionLogin({
              pendingLoginToken: response.pendingLoginToken,
              action: modalRes.confirm ? 'continue' : 'abort'
            })

            if ('aborted' in result && result.aborted) {
              uni.showToast({ title: result.message, icon: 'none', duration: 2000 })
              resolve()
              return
            }

            if (!('token' in result) || !('user' in result)) {
              throw new Error('登录响应异常')
            }

            completeLogin(result.token, result.user)
            resolve()
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
    })
  }

  const switchLoginType = (type: LoginType) => {
    if (loginType.value === type) return
    loginType.value = type
    account.value = ''
    password.value = ''
  }

  const handleLogin = async () => {
    if (!account.value.trim()) {
      uni.showToast({
        title: loginType.value === 'user' ? '请输入学号或手机号' : '请输入管理员账号',
        icon: 'none'
      })
      return
    }
    if (!password.value.trim()) {
      uni.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    loading.value = true

    try {
      const res = await login({
        account: account.value.trim(),
        password: password.value,
        loginType: loginType.value
      })

      if (isPendingDeletionResponse(res)) {
        await handlePendingDeletionLogin(res)
        return
      }

      if (!isLoginSuccessResponse(res)) {
        throw new Error('登录响应异常')
      }

      const successResponse: LoginSuccessResponse = res
      completeLogin(successResponse.token, successResponse.user)
    } catch (error: any) {
      console.error('登录失败:', error)
      uni.showToast({
        title: error.message || '登录失败，请检查账号和密码',
        icon: 'none',
        duration: 2000
      })
    } finally {
      loading.value = false
    }
  }

  const goToRegister = () => {
    uni.navigateTo({ url: '/pages/register/register' })
  }

  const goToForgot = () => {
    uni.showToast({ title: '功能开发中', icon: 'none' })
  }

  const showAgreement = () => {
    uni.showToast({ title: '用户协议', icon: 'none' })
  }

  const showPrivacy = () => {
    uni.showToast({ title: '隐私政策', icon: 'none' })
  }
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  margin-top: 60rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #fff;
  margin-bottom: 30rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
}

.login-form {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  margin-bottom: 40rpx;
}

.login-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.login-tab {
  flex: 1;
  height: 76rpx;
  line-height: 76rpx;
  text-align: center;
  border-radius: 38rpx;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 28rpx;
  font-weight: 500;
}

.login-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.form-item {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-item input {
  width: 100%;
  height: 90rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 30rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
}

.login-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 12rpx;
  margin-top: 20rpx auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn::after {
  border: none;
}

.login-btn[disabled] {
  opacity: 0.7;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
}

.link {
  font-size: 26rpx;
  color: #667eea;
}

.hint {
  color: #6b7280;
}

.login-footer {
  text-align: center;
  margin-top: auto;
  padding-bottom: 40rpx;
}

.tips {
  font-size: 24rpx;
  color: rgba(255,255,255,0.7);
}

.agreement {
  font-size: 24rpx;
  color: #fff;
  text-decoration: underline;
}
</style>
