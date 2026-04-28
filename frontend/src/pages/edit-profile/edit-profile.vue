<template>
  <view class="edit-profile-container">
    <view class="avatar-section">
      <image class="avatar" :src="form.avatar || '/static/logo.png'" mode="aspectFill" @click="chooseAvatar" />
      <view class="avatar-tip">点击更换头像</view>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="label">用户名</text>
        <input class="input" v-model="form.username" placeholder="请输入用户名" disabled />
      </view>

      <view class="form-item">
        <text class="label">学号</text>
        <input class="input" v-model="form.studentId" placeholder="请输入学号" disabled />
      </view>

      <view class="form-item">
        <text class="label">手机号</text>
        <input class="input" v-model="form.phone" placeholder="请输入手机号" type="number" />
      </view>

      <view class="form-item">
        <text class="label">邮箱</text>
        <input class="input" v-model="form.email" placeholder="请输入邮箱" />
      </view>

      <view class="form-item">
        <text class="label">学校</text>
        <input class="input" v-model="form.school" placeholder="请输入学校" />
      </view>

      <view class="form-item">
        <text class="label">专业</text>
        <input class="input" v-model="form.major" placeholder="请输入专业" />
      </view>
    </view>

    <button class="save-btn" @click="handleSave" :disabled="loading">
      {{ loading ? '保存中...' : '保存修改' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { updateUserInfo, uploadAvatar, type UserInfo } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)

const form = ref<Partial<UserInfo>>({
  username: '',
  studentId: '',
  phone: '',
  email: '',
  avatar: '',
  school: '',
  major: ''
})

onMounted(() => {
  if (authStore.userInfo) {
    form.value = { ...authStore.userInfo }
  }
})

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      await uploadAvatarImage(tempFilePath)
    }
  })
}

const uploadAvatarImage = async (filePath: string) => {
  try {
    uni.showLoading({ title: '上传中...' })
    const result = await uploadAvatar(filePath)
    form.value.avatar = result.url
    uni.showToast({ title: '上传成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '上传失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const handleSave = async () => {
  try {
    loading.value = true
    const user = await updateUserInfo(form.value)
    authStore.updateUserInfo(user)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.edit-profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 40rpx;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  margin-bottom: 20rpx;
}

.avatar-tip {
  font-size: 26rpx;
  color: #999;
}

.form-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx 0;
  margin-bottom: 40rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  width: 140rpx;
  font-size: 30rpx;
  color: #333;
}

.input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.save-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12rpx;
  font-size: 32rpx;
}

.save-btn::after {
  border: none;
}

.save-btn[disabled] {
  opacity: 0.6;
}
</style>
