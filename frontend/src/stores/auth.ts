import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const userInfo = ref<Partial<UserInfo>>({})
  const token = ref('')

  const initAuth = () => {
    console.log('=== authStore.initAuth 被调用 ===')
    const storedToken = uni.getStorageSync('token')
    const storedUserInfo = uni.getStorageSync('userInfo')
    
    console.log('storedToken:', storedToken ? '存在' : '不存在')
    console.log('storedUserInfo:', storedUserInfo)
    
    if (storedToken) {
      token.value = storedToken
      isLoggedIn.value = true
      if (storedUserInfo) {
        userInfo.value = storedUserInfo
        console.log('userInfo 已设置:', userInfo.value)
      }
    } else {
      console.log('未找到存储的 token')
    }
  }

  const login = (newToken: string, newUserInfo: Partial<UserInfo>) => {
    console.log('=== authStore.login 被调用 ===')
    console.log('newUserInfo:', newUserInfo)
    
    token.value = newToken
    userInfo.value = newUserInfo
    isLoggedIn.value = true
    
    uni.setStorageSync('token', newToken)
    uni.setStorageSync('userInfo', newUserInfo)
    
    console.log('登录信息已保存到本地存储')
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {}
    isLoggedIn.value = false
    
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }

  const updateUserInfo = (newUserInfo: Partial<UserInfo>) => {
    userInfo.value = { ...userInfo.value, ...newUserInfo }
    uni.setStorageSync('userInfo', userInfo.value)
  }

  const username = computed(() => userInfo.value.username || '')
  const studentId = computed(() => userInfo.value.studentId || '')
  const role = computed(() => userInfo.value.role || 'user')

  return {
    isLoggedIn,
    userInfo,
    token,
    username,
    studentId,
    role,
    initAuth,
    login,
    logout,
    updateUserInfo
  }
})
