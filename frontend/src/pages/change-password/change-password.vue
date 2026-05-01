<template>
  <view class="page">
    <view class="card">
      <view class="form-item">
        <text class="label">旧密码</text>
        <input v-model="form.oldPassword" class="input" password placeholder="请输入旧密码" maxlength="20" />
      </view>
      <view class="form-item">
        <text class="label">新密码</text>
        <input v-model="form.newPassword" class="input" password placeholder="请输入新密码" maxlength="20" />
      </view>
      <view class="form-item">
        <text class="label">确认新密码</text>
        <input v-model="form.confirmPassword" class="input" password placeholder="请再次输入新密码" maxlength="20" />
      </view>
      <button class="primary-btn" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中...' : '确认修改' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { changeOwnPassword } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const submitting = ref(false)
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const resetForm = () => {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
}

const submit = async () => {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    uni.showToast({ title: '请填写完整密码信息', icon: 'none' })
    return
  }

  if (form.newPassword !== form.confirmPassword) {
    uni.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
    return
  }

  if (authStore.role !== 'user') {
    uni.showToast({ title: '当前账号不支持该入口改密', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await changeOwnPassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    })
    uni.showToast({ title: '密码修改成功', icon: 'success' })
    resetForm()
    setTimeout(() => {
      uni.navigateBack()
    }, 800)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; padding: 24rpx; }
.card { background: #fff; border-radius: 18rpx; padding: 24rpx; }
.form-item { margin-bottom: 28rpx; }
.label { display: block; margin-bottom: 14rpx; font-size: 28rpx; color: #374151; font-weight: 600; }
.input { width: 100%; height: 88rpx; box-sizing: border-box; background: #f8fafc; border-radius: 14rpx; padding: 0 24rpx; font-size: 28rpx; color: #111827; }
.primary-btn { margin-top: 12rpx; height: 84rpx; line-height: 84rpx; border-radius: 42rpx; background: #007aff; color: #fff; font-size: 30rpx; }
</style>
