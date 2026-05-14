<template>
  <view class="page">
    <view class="card">
      <textarea v-model="statement" class="textarea" maxlength="500" placeholder="请描述纠纷原因，并尽量补充证据说明" />

      <view class="section">
        <text class="section-title">证据图片（可选）</text>
        <view class="images-grid">
          <view class="image-item" v-for="(img, index) in images" :key="img">
            <image :src="getImageUrl(img)" mode="aspectFill" @click="previewImages(index)" />
            <view class="delete-btn" @click="removeImage(index)">×</view>
          </view>
          <view class="upload-btn" v-if="images.length < 6" @click="chooseImage">
            <text class="upload-icon">+</text>
            <text class="upload-text">{{ images.length }}/6</text>
          </view>
        </view>
      </view>

      <button class="primary-btn" :disabled="submitting || uploading" @click="submit">{{ submitting ? '提交中...' : uploading ? '上传中...' : '提交纠纷' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createOrderDispute } from '@/api/disputes'
import { upload } from '@/utils/request'
import { getImageUrl } from '@/utils/image'

const orderId = ref(0)
const statement = ref('')
const images = ref<string[]>([])
const uploading = ref(false)
const submitting = ref(false)

onLoad((options) => {
  orderId.value = Number(options?.orderId || 0)
})

const chooseImage = async () => {
  try {
    const res = await uni.chooseImage({
      count: 6 - images.value.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    uploading.value = true
    for (const tempFilePath of res.tempFilePaths) {
      try {
        const uploadRes = await upload<{ url: string }>('/upload', tempFilePath)
        images.value.push(uploadRes.url)
      } catch (error) {
        console.error('上传纠纷图片失败:', error)
        uni.showToast({ title: '上传图片失败', icon: 'none' })
      }
    }
  } catch (error) {
    console.error('选择纠纷图片失败:', error)
  } finally {
    uploading.value = false
  }
}

const removeImage = (index: number) => {
  images.value.splice(index, 1)
}

const previewImages = (current: number) => {
  if (!images.value.length) return
  uni.previewImage({
    urls: images.value.map(img => getImageUrl(img)),
    current: getImageUrl(images.value[current])
  })
}

const submit = async () => {
  if (!orderId.value) {
    uni.showToast({ title: '订单参数无效', icon: 'none' })
    return
  }
  if (!statement.value.trim()) {
    uni.showToast({ title: '请输入纠纷说明', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const res = await createOrderDispute(orderId.value, { statement: statement.value.trim(), images: images.value })
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/dispute/detail?id=${res.dispute.id}` })
    }, 1200)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; }
.textarea { width:100%; min-height:280rpx; background:#f8fafc; border-radius:14rpx; padding:20rpx; box-sizing:border-box; }
.section { margin-top: 24rpx; }
.section-title { display:block; margin-bottom:16rpx; font-size:26rpx; font-weight:600; color:#374151; }
.images-grid { display:flex; flex-wrap:wrap; gap:20rpx; }
.image-item { position:relative; width:180rpx; height:180rpx; border-radius:14rpx; overflow:hidden; }
.image-item image { width:100%; height:100%; }
.delete-btn { position:absolute; top:8rpx; right:8rpx; width:40rpx; height:40rpx; border-radius:50%; background:rgba(0,0,0,.55); color:#fff; display:flex; align-items:center; justify-content:center; font-size:30rpx; }
.upload-btn { width:180rpx; height:180rpx; border:2rpx dashed #d1d5db; border-radius:14rpx; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f8fafc; }
.upload-icon { font-size:56rpx; color:#9ca3af; line-height:1; }
.upload-text { margin-top:8rpx; font-size:24rpx; color:#9ca3af; }
.primary-btn { margin-top:24rpx; height:84rpx; line-height:84rpx; border-radius:42rpx; background:#007aff; color:#fff; font-size:28rpx; }
</style>
