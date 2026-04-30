import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const userInfo = ref<Partial<UserInfo>>({})
  const token = ref('')

  const initAuth = () => {
    const storedToken = uni.getStorageSync('token')
    const storedUserInfo = uni.getStorageSync('userInfo')

    if (storedToken) {
      token.value = storedToken
      isLoggedIn.value = true
      if (storedUserInfo) {
        userInfo.value = storedUserInfo
      }
    }
  }

  const login = (newToken: string, newUserInfo: Partial<UserInfo>) => {
    token.value = newToken
    userInfo.value = newUserInfo
    isLoggedIn.value = true

    uni.setStorageSync('token', newToken)
    uni.setStorageSync('userInfo', newUserInfo)
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
