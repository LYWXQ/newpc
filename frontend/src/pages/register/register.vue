<template>
  <view class="register-container">
    <view class="register-header">
      <text class="title">注册账号</text>
      <text class="subtitle">加入校园闲置共享平台</text>
    </view>

    <scroll-view class="form-scroll-view" scroll-y>
      <view class="register-form">
        <view class="form-item">
          <text class="label">
            <text class="required">*</text>
            学号
          </text>
          <input 
            type="text" 
            v-model="studentId" 
            placeholder="请输入学号"
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <text class="label">
            <text class="required">*</text>
            用户名
          </text>
          <input 
            type="text" 
            v-model="username" 
            placeholder="请输入用户名"
            maxlength="50"
          />
        </view>

        <view class="form-item school-selector">
          <text class="label">学校</text>
          <input 
            type="text" 
            v-model="schoolInput" 
            placeholder="请搜索并选择学校"
            maxlength="100"
            @input="handleSchoolInput"
            @focus="showDropdown = true"
          />
          <view class="dropdown" v-if="showDropdown && filteredUniversities.length > 0">
            <view 
              v-for="uni in filteredUniversities" 
              :key="uni" 
              class="dropdown-item"
              @click="selectSchool(uni)"
            >
              <text>{{ uni }}</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="label">专业</text>
          <input 
            type="text" 
            v-model="major" 
            placeholder="请输入专业"
            maxlength="100"
          />
        </view>

        <view class="form-item">
          <text class="label">
            <text class="required">*</text>
            手机号
          </text>
          <input 
            type="number" 
            v-model="phone" 
            placeholder="请输入手机号"
            maxlength="11"
          />
        </view>

        <view class="form-item">
          <text class="label">
            <text class="required">*</text>
            密码
          </text>
          <input 
            type="password" 
            v-model="password" 
            placeholder="请输入密码（6-20位）"
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <text class="label">
            <text class="required">*</text>
            确认密码
          </text>
          <input 
            type="password" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码"
            maxlength="20"
          />
        </view>

        <view class="form-item agreement-item">
          <checkbox :checked="agreed" @click="agreed = !agreed" color="#667eea" />
          <text class="agreement-text">
            <text class="required">*</text>
            我已阅读并同意
            <text class="link" @click="showAgreement">《用户协议》</text>
            和
            <text class="link" @click="showPrivacy">《隐私政策》</text>
          </text>
        </view>

        <view class="required-hint">
          <text class="required">*</text>
          <text>为必填项</text>
        </view>

        <button class="register-btn" @click="handleRegister" :loading="loading" :disabled="loading">
          注册
        </button>

        <view class="form-footer">
          <text class="link" @click="goToLogin">已有账号？去登录</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { register } from '@/api/auth'
import { UNIVERSITIES } from '@/utils/universities'

const studentId = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreed = ref(false)
const loading = ref(false)
const schoolInput = ref('')
const selectedSchool = ref('')
const major = ref('')
const phone = ref('')
const filteredUniversities = ref<string[]>([])
const showDropdown = ref(false)
let debounceTimer: number | null = null

const debounce = (fn: () => void, delay: number) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(fn, delay) as unknown as number
}

const handleSchoolInput = () => {
  debounce(() => {
    searchUniversities(schoolInput.value)
  }, 300)
}

const searchUniversities = (query: string) => {
  if (!query.trim()) {
    filteredUniversities.value = []
    return
  }
  filteredUniversities.value = UNIVERSITIES.filter(uni => 
    uni.toLowerCase().includes(query.toLowerCase())
  )
}

const selectSchool = (uni: string) => {
  schoolInput.value = uni
  selectedSchool.value = uni
  showDropdown.value = false
}

const handleRegister = async () => {
  if (!studentId.value.trim()) {
    uni.showToast({ title: '请输入学号', icon: 'none' })
    return
  }
  if (!username.value.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!phone.value.trim()) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!password.value.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  if (password.value.length < 6) {
    uni.showToast({ title: '密码长度不能少于6位', icon: 'none' })
    return
  }
  if (password.value !== confirmPassword.value) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  if (!agreed.value) {
    uni.showToast({ title: '请同意用户协议和隐私政策', icon: 'none' })
    return
  }

  loading.value = true
  
  try {
    const res = await register({
      studentId: studentId.value,
      username: username.value,
      password: password.value,
      school: selectedSchool.value || schoolInput.value,
      major: major.value,
      phone: phone.value
    })
    
    uni.showToast({ title: '注册成功', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    console.error('注册失败:', error)
    uni.showToast({ 
      title: error.message || '注册失败，请稍后重试', 
      icon: 'none',
      duration: 2000
    })
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  uni.navigateBack()
}

const showAgreement = () => {
  uni.showToast({ title: '用户协议', icon: 'none' })
}

const showPrivacy = () => {
  uni.showToast({ title: '隐私政策', icon: 'none' })
}
</script>

<style lang="scss">
.register-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 40rpx;
  box-sizing: border-box;
}

.register-header {
  margin-bottom: 30rpx;
  margin-top: 20rpx;
  flex-shrink: 0;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
  display: block;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  display: block;
}

.register-form {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.required {
  color: #ff4d4f;
  margin-right: 4rpx;
}

.required-hint {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
  text-align: left;
}

.form-scroll-view {
  flex: 1;
  overflow-y: auto;
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

.school-selector {
  position: relative;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12rpx;
  margin-top: 8rpx;
  max-height: 400rpx;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 24rpx 30rpx;
  border-bottom: 1px solid #f0f0f0;
  font-size: 28rpx;
  color: #333;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: #f5f5f5;
  }
}

.agreement-item {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.agreement-text {
  font-size: 24rpx;
  color: #666;
  margin-left: 16rpx;
  flex: 1;
}

.link {
  color: #667eea;
}

.register-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-btn::after {
  border: none;
}

.register-btn[disabled] {
  opacity: 0.7;
}

.form-footer {
  text-align: center;
  margin-top: 40rpx;
}
</style>
