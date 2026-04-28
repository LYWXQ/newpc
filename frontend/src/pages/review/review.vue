<template>
  <view class="review-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">评价订单</text>
    </view>

    <!-- 订单信息 -->
    <view class="order-info" v-if="order">
      <image class="item-image" :src="getImageUrl(order.item?.images?.[0])" mode="aspectFill" />
      <view class="item-detail">
        <text class="item-title">{{ order.item?.title }}</text>
        <text class="order-no">订单号: {{ order.id }}</text>
      </view>
    </view>

    <!-- 评分区域 -->
    <view class="rating-section">
      <text class="section-title">评分</text>
      <view class="rating-stars">
        <text 
          class="star" 
          v-for="index in 5" 
          :key="index"
          :class="{ active: index <= rating }"
          @click="setRating(index)"
        >
          ★
        </text>
      </view>
      <text class="rating-text">{{ ratingText }}</text>
    </view>

    <!-- 评价内容 -->
    <view class="content-section">
      <text class="section-title">评价内容</text>
      <textarea 
        class="content-input"
        v-model="content"
        placeholder="请分享您的使用体验，帮助其他用户更好地了解这个物品..."
        maxlength="500"
      />
      <text class="word-count">{{ content.length }}/500</text>
    </view>

    <!-- 图片上传 -->
    <view class="images-section">
      <text class="section-title">添加图片（可选）</text>
      <view class="images-grid">
        <view class="image-item" v-for="(img, index) in images" :key="index">
          <image :src="img" mode="aspectFill" />
          <view class="delete-btn" @click="removeImage(index)">×</view>
        </view>
        <view class="upload-btn" @click="chooseImage" v-if="images.length < 6">
          <text class="upload-icon">+</text>
          <text class="upload-text">{{ images.length }}/6</text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <button class="submit-btn" @click="handleSubmit" :disabled="submitting || rating === 0">
      {{ submitting ? '提交中...' : '提交评价' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createReview } from '@/api/reviews'
import { getOrderDetail, type Order } from '@/api/orders'
import { upload } from '@/utils/request'

const orderId = ref<number>(0)
const order = ref<Order | null>(null)
const rating = ref(0)
const content = ref('')
const images = ref<string[]>([])
const submitting = ref(false)

const ratingText = computed(() => {
  const texts = ['', '非常差', '差', '一般', '好', '非常好']
  return texts[rating.value] || ''
})

// 获取图片完整 URL
const getImageUrl = (url?: string) => {
  if (!url) return '/static/logo.png'
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

onLoad((options) => {
  if (options?.orderId) {
    orderId.value = parseInt(options.orderId)
    loadOrderDetail()
  }
})

const loadOrderDetail = async () => {
  try {
    const res = await getOrderDetail(orderId.value)
    order.value = res.order
  } catch (error) {
    console.error('加载订单详情失败:', error)
    uni.showToast({ title: '加载订单失败', icon: 'none' })
  }
}

const setRating = (value: number) => {
  rating.value = value
}

const chooseImage = async () => {
  try {
    const res = await uni.chooseImage({
      count: 6 - images.value.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    // 上传每张图片
    for (const tempFilePath of res.tempFilePaths) {
      try {
        const uploadRes = await upload('/upload', tempFilePath)
        images.value.push(uploadRes.url)
      } catch (error) {
        console.error('上传图片失败:', error)
        uni.showToast({ title: '上传图片失败', icon: 'none' })
      }
    }
  } catch (error) {
    console.error('选择图片失败:', error)
  }
}

const removeImage = (index: number) => {
  images.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (rating.value === 0) {
    uni.showToast({ title: '请选择评分', icon: 'none' })
    return
  }

  if (!content.value.trim()) {
    uni.showToast({ title: '请输入评价内容', icon: 'none' })
    return
  }

  submitting.value = true

  try {
    await createReview({
      orderId: orderId.value,
      rating: rating.value,
      content: content.value,
      images: images.value
    })

    uni.showToast({ title: '评价成功', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    console.error('提交评价失败:', error)
    uni.showToast({ 
      title: error.message || '评价失败', 
      icon: 'none' 
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss">
.review-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.page-header {
  padding: 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.order-info {
  display: flex;
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  margin-right: 24rpx;
}

.item-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 12rpx;
}

.order-no {
  font-size: 24rpx;
  color: #999;
}

.rating-section,
.content-section,
.images-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 24rpx;
  display: block;
}

.rating-stars {
  display: flex;
  justify-content: center;
  margin-bottom: 16rpx;
}

.star {
  font-size: 60rpx;
  color: #ddd;
  margin: 0 12rpx;
  transition: color 0.2s;
}

.star.active {
  color: #ffb800;
}

.rating-text {
  text-align: center;
  font-size: 28rpx;
  color: #666;
}

.content-input {
  width: 100%;
  height: 240rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.word-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.image-item image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
}

.upload-icon {
  font-size: 60rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

.submit-btn {
  margin: 40rpx 30rpx;
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

.submit-btn::after {
  border: none;
}

.submit-btn[disabled] {
  opacity: 0.6;
}
</style>
