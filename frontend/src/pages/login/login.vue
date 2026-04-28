<template>
  <view class="login-container">
    <view class="login-header">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">校园闲置共享</text>
      <text class="subtitle">让闲置物品流动起来</text>
    </view>

    <view class="login-tabs">
      <view 
        class="login-tab" 
        :class="{ active: loginTab === 'user' }"
        @click="loginTab = 'user'"
      >
        普通用户
      </view>
      <view 
        class="login-tab" 
        :class="{ active: loginTab === 'admin' }"
        @click="loginTab = 'admin'"
      >
        管理员
      </view>
    </view>

    <view class="login-form">
      <view class="form-item">
        <text class="label">{{ loginTab === 'user' ? '学号/用户名' : '用户名' }}</text>
        <input 
          type="text" 
          v-model="account" 
          :placeholder="loginTab === 'user' ? '请输入学号或用户名' : '请输入用户名'"
          maxlength="50"
        />
      </view>

      <view class="form-item">
        <text class="label">密码</text>
        <input 
          type="password" 
          v-model="password" 
          placeholder="请输入密码"
          maxlength="20"
        />
      </view>

      <button class="login-btn" @click="handleLogin" :loading="loading" :disabled="loading">
        登录
      </button>

      <view class="form-footer" v-if="loginTab === 'user'">
        <text class="link" @click="goToRegister">还没有账号？去注册</text>
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
import { login, type UserInfo } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loginTab = ref<'user' | 'admin'>('user')
const account = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!account.value.trim()) {
    uni.showToast({ 
      title: loginTab.value === 'user' ? '请输入学号或用户名' : '请输入用户名', 
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
    console.log('登录请求参数:', { account: account.value, password: password.value })
    
    const res = await login({
      account: account.value,
      password: password.value
    })
    
    console.log('登录响应:', res)
    
    const user = res.user as UserInfo
    
    // 根据选择的tab验证用户角色
    if (loginTab.value === 'user') {
      // 普通用户tab：只能登录普通用户
      if (user.role !== 'user') {
        uni.showToast({ 
          title: '该账号不是普通用户，请在管理员tab登录', 
          icon: 'none',
          duration: 2000
        })
        return
      }
    } else {
      // 管理员tab：只能登录管理员或超级用户
      if (user.role !== 'admin' && user.role !== 'root') {
        uni.showToast({ 
          title: '该账号不是管理员，请在普通用户tab登录', 
          icon: 'none',
          duration: 2000
        })
        return
      }
    }
    
    authStore.login(res.token, res.user)
    
    uni.showToast({ title: '登录成功', icon: 'success' })
    
    setTimeout(() => {
      if (user.role === 'admin' || user.role === 'root') {
        uni.navigateTo({ url: '/pages/admin/admin' })
      } else {
        uni.switchTab({ url: '/pages/index/index' })
      }
    }, 1500)
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

.login-tabs {
  display: flex;
  background-color: rgba(255,255,255,0.2);
  border-radius: 12rpx;
  padding: 8rpx;
  margin-bottom: 40rpx;
}

.login-tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  border-radius: 8rpx;
  transition: all 0.3s;
}

.login-tab.active {
  background-color: #fff;
  color: #667eea;
  font-weight: 500;
}

.login-form {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  margin-bottom: 40rpx;
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
