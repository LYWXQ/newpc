<template>
  <view class="page">
    <view class="card">
      <input v-model="form.username" class="input" placeholder="请输入管理员用户名" />
      <input v-model="form.password" class="input" password placeholder="请输入初始密码" />
      <button class="primary-btn" :disabled="submitting" @click="submit">{{ submitting ? '创建中...' : '创建管理员' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createAdmin } from '@/api/admin'

const form = reactive({ username: '', password: '' })
const submitting = ref(false)

const submit = async () => {
  if (!form.username.trim() || !form.password.trim()) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await createAdmin({ username: form.username.trim(), password: form.password.trim(), role: 'admin' })
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1200)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; }
.input { width:100%; height:88rpx; background:#f8fafc; border-radius:14rpx; padding:0 24rpx; margin-bottom:20rpx; box-sizing:border-box; }
.primary-btn { height:84rpx; line-height:84rpx; border-radius:42rpx; background:#007aff; color:#fff; font-size:28rpx; }
</style>
