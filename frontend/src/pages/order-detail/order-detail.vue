<template>
  <view class="container">
    <view class="order-detail" v-if="order">
      <view class="order-header">
        <text class="order-status">订单状态：{{ statusText }}</text>
        <text class="order-time">{{ formatDate(order.createdAt) }}</text>
      </view>

      <view class="order-info">
        <text class="section-title">订单信息</text>
        <view class="info-item">
          <text class="info-label">订单编号：</text>
          <text class="info-value">ORD{{ order.id.toString().padStart(10, '0') }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">借用时间：</text>
          <text class="info-value">{{ formatDate(order.startDate) }} 至 {{ formatDate(order.endDate) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">租金：</text>
          <text class="info-value">¥{{ order.totalPrice.toFixed(2) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">押金：</text>
          <text class="info-value">¥{{ order.deposit.toFixed(2) }}</text>
        </view>
        <view class="info-item" v-if="order.note">
          <text class="info-label">备注：</text>
          <text class="info-value">{{ order.note }}</text>
        </view>
        <view class="info-item" v-if="order.cancelReason">
          <text class="info-label">取消原因：</text>
          <text class="info-value">{{ order.cancelReason }}</text>
        </view>
      </view>

      <view class="item-info" v-if="order.item">
        <text class="section-title">物品信息</text>
        <view class="item-card">
          <image class="item-image" :src="order.item.images?.[0] || '/static/logo.png'" mode="aspectFill"></image>
          <view class="item-details">
            <text class="item-title">{{ order.item.title }}</text>
            <text class="item-price">¥{{ order.item.price.toFixed(2) }}/天</text>
          </view>
        </view>
      </view>

      <view class="user-info">
        <text class="section-title">用户信息</text>
        <view class="info-item" v-if="order.lender">
          <text class="info-label">出借方：</text>
          <view class="user-info-row">
            <image class="user-avatar" :src="order.lender.avatar || '/static/logo.png'" mode="aspectFill"></image>
            <text class="info-value">{{ order.lender.username }}</text>
          </view>
        </view>
        <view class="info-item" v-if="order.borrower">
          <text class="info-label">借用方：</text>
          <view class="user-info-row">
            <image class="user-avatar" :src="order.borrower.avatar || '/static/logo.png'" mode="aspectFill"></image>
            <text class="info-value">{{ order.borrower.username }}</text>
          </view>
        </view>
      </view>

      <view class="action-buttons">
        <!-- pending 状态：出借方显示同意/拒绝按钮 -->
        <template v-if="order.status === 'pending' && isLender">
          <button class="approve-button" @click="handleApprove">同意</button>
          <button class="reject-button" @click="handleReject">拒绝</button>
        </template>

        <!-- approved 状态：借用方显示确认取货按钮 -->
        <template v-if="order.status === 'approved' && isBorrower">
          <button class="confirm-button" @click="handleConfirmPickup">确认取货</button>
        </template>

        <!-- in_progress 状态：双方都可操作完成订单 -->
        <template v-if="order.status === 'in_progress'">
          <button class="complete-button" @click="handleComplete">完成订单</button>
        </template>

        <!-- completed 状态：显示评价按钮 -->
        <template v-if="canReview">
          <button class="review-button" @click="goToReview">评价订单</button>
        </template>

        <!-- 联系对方按钮 -->
        <button class="chat-button" @click="handleChat">联系对方</button>

        <!-- 取消订单按钮（pending、approved 状态可取消） -->
        <button
          class="cancel-button"
          v-if="canCancel"
          @click="handleCancel"
        >取消订单</button>
      </view>
      
      <!-- 已完成订单显示评价 -->
      <view class="review-section" v-if="order.status === 'completed' && review">
        <text class="section-title">评价</text>
        <view class="review-card">
          <view class="review-header">
            <image class="reviewer-avatar" :src="review.reviewer?.avatar || '/static/logo.png'" mode="aspectFill"></image>
            <view class="reviewer-info">
              <text class="reviewer-name">{{ review.reviewer?.username }}</text>
              <view class="review-rating">
                <text 
                  class="star" 
                  v-for="index in 5" 
                  :key="index"
                  :class="{ active: index <= review.rating }"
                >★</text>
              </view>
            </view>
          </view>
          <text class="review-content">{{ review.content }}</text>
          <view class="review-images" v-if="review.images && review.images.length > 0">
            <image 
              class="review-image" 
              v-for="(img, index) in review.images" 
              :key="index"
              :src="img" 
              mode="aspectFill"
            ></image>
          </view>
        </view>
      </view>
    </view>

    <view class="loading" v-else>
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  getOrderDetail,
  approveOrder,
  rejectOrder,
  confirmPickup,
  completeOrder,
  cancelOrder,
  type Order
} from '@/api/orders'
import { getOrderReview } from '@/api/reviews'
import { useAuthStore } from '@/stores/auth'

// 订单数据
const order = ref<Order | null>(null)
const orderId = ref<number>(0)
const review = ref<any>(null)
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.userInfo?.id || 0)

// 状态文本映射
const statusMap: Record<string, string> = {
  pending: '待处理',
  approved: '已同意',
  rejected: '已拒绝',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const statusText = computed(() => {
  return order.value ? statusMap[order.value.status] || order.value.status : ''
})

// 判断当前用户是否为出借方
const isLender = computed(() => {
  return order.value?.lenderId === currentUserId.value
})

// 判断当前用户是否为借用方
const isBorrower = computed(() => {
  return order.value?.borrowerId === currentUserId.value
})

// 判断是否可以取消订单
const canCancel = computed(() => {
  if (!order.value) return false
  // pending 和 approved 状态可以取消
  const cancellableStatuses = ['pending', 'approved']
  return cancellableStatuses.includes(order.value.status)
})

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 判断订单是否可以评价
const canReview = computed(() => {
  return order.value?.status === 'completed' && !review.value
})

// 加载订单评价
const loadOrderReview = async () => {
  try {
    const res = await getOrderReview(orderId.value)
    review.value = res.review
  } catch (error) {
    console.error('加载订单评价失败:', error)
  }
}

// 加载订单详情
const loadOrderDetail = async () => {
  if (!orderId.value) {
    uni.showToast({ title: '订单ID无效', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '加载中...' })
    const res = await getOrderDetail(orderId.value)
    order.value = res.order
    
    // 加载评价
    if (res.order.status === 'completed') {
      await loadOrderReview()
    }
    
    uni.hideLoading()
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '加载订单失败', icon: 'none' })
    console.error('加载订单详情失败:', error)
  }
}

// 跳转到评价页面
const goToReview = () => {
  uni.navigateTo({
    url: `/pages/review/review?orderId=${orderId.value}`
  })
}

// 同意订单
const handleApprove = async () => {
  try {
    uni.showLoading({ title: '处理中...' })
    await approveOrder(orderId.value)
    uni.hideLoading()
    uni.showToast({ title: '已同意订单', icon: 'success' })
    loadOrderDetail()
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '操作失败', icon: 'none' })
    console.error('同意订单失败:', error)
  }
}

// 拒绝订单
const handleReject = () => {
  uni.showModal({
    title: '拒绝订单',
    content: '确定要拒绝这个订单吗？',
    editable: true,
    placeholderText: '请输入拒绝原因（可选）',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          await rejectOrder(orderId.value, res.content || undefined)
          uni.hideLoading()
          uni.showToast({ title: '已拒绝订单', icon: 'success' })
          loadOrderDetail()
        } catch (error) {
          uni.hideLoading()
          uni.showToast({ title: '操作失败', icon: 'none' })
          console.error('拒绝订单失败:', error)
        }
      }
    }
  })
}

// 确认取货
const handleConfirmPickup = async () => {
  try {
    uni.showLoading({ title: '处理中...' })
    await confirmPickup(orderId.value)
    uni.hideLoading()
    uni.showToast({ title: '已确认取货', icon: 'success' })
    loadOrderDetail()
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '操作失败', icon: 'none' })
    console.error('确认取货失败:', error)
  }
}

// 完成订单
const handleComplete = async () => {
  uni.showModal({
    title: '完成订单',
    content: '确定要完成这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          await completeOrder(orderId.value)
          uni.hideLoading()
          uni.showToast({ title: '订单已完成', icon: 'success' })
          loadOrderDetail()
        } catch (error) {
          uni.hideLoading()
          uni.showToast({ title: '操作失败', icon: 'none' })
          console.error('完成订单失败:', error)
        }
      }
    }
  })
}

// 取消订单
const handleCancel = () => {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消这个订单吗？',
    editable: true,
    placeholderText: '请输入取消原因（可选）',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          await cancelOrder(orderId.value, res.content || undefined)
          uni.hideLoading()
          uni.showToast({ title: '订单已取消', icon: 'success' })
          loadOrderDetail()
        } catch (error) {
          uni.hideLoading()
          uni.showToast({ title: '操作失败', icon: 'none' })
          console.error('取消订单失败:', error)
        }
      }
    }
  })
}

// 联系对方
const handleChat = () => {
  if (!order.value) return
  const targetUserId = isLender.value ? order.value.borrowerId : order.value.lenderId
  const targetUser = isLender.value ? order.value.borrower : order.value.lender

  uni.navigateTo({
    url: `/pages/chat/chat?userId=${targetUserId}&username=${encodeURIComponent(targetUser?.username || '')}`
  })
}

// 页面加载
onLoad((options) => {
  if (options?.id) {
    orderId.value = parseInt(options.id, 10)
    loadOrderDetail()
  } else {
    uni.showToast({ title: '订单ID无效', icon: 'none' })
  }
})
</script>

<style scoped>
.container {
  padding: 16rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.order-detail {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.order-status {
  font-size: 28rpx;
  font-weight: bold;
  color: #ff9800;
}

.order-time {
  font-size: 24rpx;
  color: #999999;
}

.order-info,
.item-info,
.user-info {
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
  display: block;
  color: #333333;
}

.info-item {
  display: flex;
  margin-bottom: 12rpx;
  align-items: center;
}

.info-label {
  font-size: 24rpx;
  color: #666666;
  width: 140rpx;
  flex-shrink: 0;
}

.info-value {
  font-size: 24rpx;
  color: #333333;
  flex: 1;
}

.user-info-row {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  margin-right: 12rpx;
}

.item-card {
  display: flex;
  align-items: center;
}

.item-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
}

.item-details {
  flex: 1;
}

.item-title {
  font-size: 24rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  display: block;
  color: #333333;
}

.item-price {
  font-size: 24rpx;
  color: #ff4d4f;
  display: block;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
}

.action-buttons button {
  flex: 1;
  min-width: 200rpx;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  margin: 0;
}

.chat-button {
  background-color: #f0f0f0;
  color: #333333;
}

.cancel-button {
  background-color: #ff4d4f;
  color: #ffffff;
}

.approve-button {
  background-color: #52c41a;
  color: #ffffff;
}

.reject-button {
  background-color: #ff4d4f;
  color: #ffffff;
}

.confirm-button {
  background-color: #1890ff;
  color: #ffffff;
}

.complete-button {
  background-color: #52c41a;
  color: #ffffff;
}

.review-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.review-section {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-top: 16rpx;
}

.review-card {
  padding: 16rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.reviewer-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.reviewer-info {
  flex: 1;
}

.reviewer-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}

.review-rating {
  display: flex;
}

.review-rating .star {
  font-size: 24rpx;
  color: #ddd;
  margin-right: 2rpx;
}

.review-rating .star.active {
  color: #ffb800;
}

.review-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.review-images {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.review-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #999999;
  font-size: 28rpx;
}
</style>
