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
          <text class="info-label">交易时间：</text>
          <text class="info-value">{{ formatDate(order.startDate) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">约定交还：</text>
          <text class="info-value">{{ formatDate(order.endDate) }}</text>
        </view>
        <view class="info-item" v-if="order.actualPickupTime">
          <text class="info-label">实际取货：</text>
          <text class="info-value">{{ formatDate(order.actualPickupTime) }}</text>
        </view>
        <view class="info-item" v-if="order.actualReturnTime">
          <text class="info-label">实际归还：</text>
          <text class="info-value">{{ formatDate(order.actualReturnTime) }}</text>
        </view>
        <view class="info-item" v-if="order.returnConfirmedTime">
          <text class="info-label">最终完成：</text>
          <text class="info-value">{{ formatDate(order.returnConfirmedTime) }}</text>
        </view>
        <view class="info-item" v-if="order.isEarlyReturn">
          <text class="info-label">提前归还：</text>
          <text class="info-value highlight">是，本次提前交还</text>
        </view>
        <view class="info-item">
          <text class="info-label">租金：</text>
          <text class="info-value">¥{{ Number(order.totalPrice).toFixed(2) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">押金：</text>
          <text class="info-value">¥{{ Number(order.deposit).toFixed(2) }}</text>
        </view>
        <view class="info-item" v-if="order.pickupLocation">
          <text class="info-label">取货地点：</text>
          <text class="info-value">{{ order.pickupLocation }}</text>
        </view>
        <view class="info-item" v-if="order.returnLocation">
          <text class="info-label">还货地点：</text>
          <text class="info-value">{{ order.returnLocation }}</text>
        </view>
        <view class="info-item" v-if="order.note">
          <text class="info-label">备注：</text>
          <text class="info-value">{{ order.note }}</text>
        </view>
        <view class="info-item" v-if="order.cancelReason">
          <text class="info-label">取消原因：</text>
          <text class="info-value">{{ order.cancelReason }}</text>
        </view>
        <view class="info-item" v-if="order.status === 'confirmed' && !order.pendingConfirmation && isLender && order.pickupCode">
          <text class="info-label">取件码：</text>
          <text class="info-value highlight">{{ order.pickupCode }}</text>
        </view>
        <view
          class="info-item"
          v-if="isLender && isRentOrder && order.returnCode && ['confirmed', 'using', 'returned'].includes(order.status)"
        >
          <text class="info-label">归还码：</text>
          <text class="info-value highlight">{{ order.returnCode }}</text>
        </view>
        <view class="info-item" v-if="borrowerVerificationHint">
          <text class="info-label">验码提醒：</text>
          <text class="info-value">{{ borrowerVerificationHint }}</text>
        </view>
      </view>

      <view class="item-info" v-if="order.item">
        <text class="section-title">物品信息</text>
        <view class="item-card">
          <image class="item-image" :src="getImageUrl(order.item.images?.[0])" mode="aspectFill"/>
          <view class="item-details">
            <text class="item-title">{{ order.item.title }}</text>
            <text class="item-price">¥{{ Number(order.item.price).toFixed(2) }}/天</text>
          </view>
        </view>
      </view>

      <view class="user-info">
        <text class="section-title">用户信息</text>
        <view class="info-item">
          <text class="info-label">出借方：</text>
          <view class="user-info-row">
            <image class="user-avatar" :src="getImageUrl(order.lender?.avatar)" mode="aspectFill"/>
            <text class="info-value">{{ getUserDisplayName(order.lender) }}</text>
          </view>
        </view>
        <view class="info-item">
          <text class="info-label">借用方：</text>
          <view class="user-info-row">
            <image class="user-avatar" :src="getImageUrl(order.borrower?.avatar)" mode="aspectFill"/>
            <text class="info-value">{{ getUserDisplayName(order.borrower) }}</text>
          </view>
        </view>
      </view>

      <view class="contact-info" v-if="otherUser && (otherUser.phone || otherUser.qq)">
        <text class="section-title">联系方式</text>
        <view class="contact-item" v-if="otherUser.phone" @click="copyContact(otherUser.phone)">
          <text class="contact-label">手机号</text>
          <text class="contact-value">{{ otherUser.phone }}</text>
        </view>
        <view class="contact-item" v-if="otherUser.qq" @click="copyContact(otherUser.qq)">
          <text class="contact-label">QQ</text>
          <text class="contact-value">{{ otherUser.qq }}</text>
        </view>
      </view>

      <view class="action-buttons">
        <template v-if="order.status === 'pending' && isLender">
          <button class="approve-button" @click="handleApprove">同意</button>
          <button class="reject-button" @click="handleReject">拒绝</button>
        </template>

        <template v-if="order.status === 'confirmed' && order.pendingConfirmation && isBorrower">
          <button class="confirm-button" @click="handleConfirmChanges">确认修改</button>
        </template>

        <template v-if="canSubmitPickupCode">
          <button class="confirm-button" @click="handleConfirmPickup">输入取件码</button>
        </template>

        <template v-if="canConfirmPickupByLenderAction">
          <button class="approve-button" @click="handleConfirmPickupByLender">确认交付</button>
        </template>

        <template v-if="canSubmitReturnCode">
          <button class="return-button" @click="handleReturn">输入归还码</button>
        </template>

        <template v-if="canConfirmReturnByLenderAction">
          <button class="approve-button" @click="handleConfirmReturnByLender">确认收回</button>
        </template>

        <template v-if="order.status === 'returned' && isLender">
          <button class="complete-button" @click="handleComplete">完成订单</button>
        </template>

        <template v-if="actionHint">
          <text class="action-hint">{{ actionHint }}</text>
        </template>

        <template v-if="canReview">
          <button class="review-button" @click="goToReview">评价订单</button>
        </template>

        <button class="cancel-button" v-if="canCancel" @click="handleCancel">取消订单</button>
      </view>

      <view class="review-section" v-if="order.status === 'completed'">
        <text class="section-title">评价</text>
        <view v-if="reviews.length === 0" class="empty-review">
          <text>暂时还没有评价</text>
        </view>
        <view class="review-card" v-for="review in reviews" :key="review.id">
          <view class="review-header">
            <image class="reviewer-avatar" :src="getImageUrl(review.reviewer?.avatar)" mode="aspectFill"/>
            <view class="reviewer-info">
              <text class="reviewer-name">{{ getReviewerDisplayName(review) }}</text>
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
              :src="getImageUrl(img)"
              mode="aspectFill"
            />
          </view>
        </view>
      </view>
    </view>

    <view class="loading" v-else>
      <text>加载中...</text>
    </view>

    <view class="pickup-dialog-mask" v-if="showPickupDialog" @click="closePickupDialog">
      <view class="pickup-dialog" @click.stop>
        <view class="pickup-dialog-header">
          <text class="pickup-dialog-title">{{ verificationDialogTitle }}</text>
          <text class="pickup-dialog-close" @click="closePickupDialog">×</text>
        </view>
        <text class="pickup-dialog-tip">{{ verificationDialogTip }}</text>
        <input
          class="pickup-code-input"
          v-model="pickupCodeInput"
          :placeholder="verificationDialogPlaceholder"
          maxlength="12"
          @input="handlePickupCodeInput"
        >
        <view class="pickup-dialog-actions">
          <button class="pickup-cancel-button" @click="closePickupDialog">取消</button>
          <button class="pickup-confirm-button" @click="submitVerificationCode">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import {
    getOrderDetail,
    confirmOrder,
    rejectOrder,
    confirmPickup,
    confirmPickupByLender,
    confirmChanges,
    returnOrder,
    confirmReturnByLender,
    completeOrder,
    cancelOrder,
    type Order
  } from '@/api/orders'
  import { getOrderReview, type Review } from '@/api/reviews'
  import { useAuthStore } from '@/stores/auth'
  import { getImageUrl } from '@/utils/image'

  const order = ref<Order | null>(null)
  const orderId = ref<number>(0)
  const reviews = ref<Review[]>([])
  const canReviewFlag = ref(false)
  const showPickupDialog = ref(false)
  const pickupCodeInput = ref('')
  const verificationMode = ref<'pickup' | 'return'>('pickup')
  const authStore = useAuthStore()
  const currentUserId = computed(() => authStore.userInfo?.id || 0)

  const isLender = computed(() => order.value?.lenderId === currentUserId.value)
  const isBorrower = computed(() => order.value?.borrowerId === currentUserId.value)
  const transactionType = computed(() => order.value?.item?.transactionType || 'rent')
  const isRentOrder = computed(() => transactionType.value === 'rent')
  const pickupCodeSubmitted = computed(() => Boolean(order.value?.pickupCodeVerifiedAt))
  const pickupConfirmed = computed(() => Boolean(order.value?.pickupConfirmedByLenderAt))
  const returnCodeSubmitted = computed(() => Boolean(order.value?.returnCodeVerifiedAt))
  const returnConfirmed = computed(() => Boolean(order.value?.returnConfirmedByLenderAt))

  const statusText = computed(() => {
    if (!order.value) return ''

    if (order.value.status === 'confirmed') {
      return pickupCodeSubmitted.value && !pickupConfirmed.value ? '待卖方确认交付' : '待取货'
    }

    if (order.value.status === 'using') {
      return returnCodeSubmitted.value && !returnConfirmed.value ? '待卖方确认收回' : '使用中'
    }

    if (order.value.status === 'returned') {
      return '待完成'
    }

    const statusMap: Record<string, string> = {
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消'
    }

    return statusMap[order.value.status] || order.value.status
  })

  const otherUser = computed(() => {
    if (!order.value) return null
    return isLender.value ? order.value.borrower : order.value.lender
  })

  const canCancel = computed(() => {
    if (!order.value) return false
    return ['pending', 'confirmed'].includes(order.value.status)
  })

  const canReview = computed(() => {
    return order.value?.status === 'completed' && canReviewFlag.value
  })

  const canSubmitPickupCode = computed(() => {
    return Boolean(order.value && isBorrower.value && order.value.status === 'confirmed' && !order.value.pendingConfirmation && !pickupCodeSubmitted.value)
  })

  const canConfirmPickupByLenderAction = computed(() => {
    return Boolean(order.value && isLender.value && order.value.status === 'confirmed' && !order.value.pendingConfirmation && pickupCodeSubmitted.value && !pickupConfirmed.value)
  })

  const canSubmitReturnCode = computed(() => {
    return Boolean(order.value && isBorrower.value && isRentOrder.value && order.value.status === 'using' && pickupConfirmed.value && !returnCodeSubmitted.value)
  })

  const canConfirmReturnByLenderAction = computed(() => {
    return Boolean(order.value && isLender.value && isRentOrder.value && order.value.status === 'using' && returnCodeSubmitted.value && !returnConfirmed.value)
  })

  const actionHint = computed(() => {
    if (!order.value) return ''

    if (order.value.status === 'confirmed' && !order.value.pendingConfirmation) {
      if (isBorrower.value && pickupCodeSubmitted.value && !pickupConfirmed.value) {
        return '已提交取件码，等待卖方确认交付'
      }

      if (isLender.value && !pickupCodeSubmitted.value) {
        return '等待买方输入取件码'
      }
    }

    if (order.value.status === 'using' && isRentOrder.value) {
      if (isBorrower.value && returnCodeSubmitted.value && !returnConfirmed.value) {
        return '已提交归还码，等待卖方确认收回'
      }

      if (isLender.value && !returnCodeSubmitted.value) {
        return '等待买方输入归还码'
      }
    }

    if (order.value.status === 'returned' && isBorrower.value) {
      return '卖方已确认收回，等待卖方完成订单'
    }

    return ''
  })

  const borrowerVerificationHint = computed(() => {
    if (!order.value || !isBorrower.value || order.value.pendingConfirmation) return ''

    if (order.value.status === 'confirmed') {
      return pickupCodeSubmitted.value ? '取件码已提交，等待卖方确认交付' : '请向卖方获取取件码后完成验码'
    }

    if (order.value.status === 'using' && isRentOrder.value) {
      return returnCodeSubmitted.value ? '归还码已提交，等待卖方确认收回' : '归还时请向卖方获取归还码并完成验码'
    }

    return ''
  })

  const verificationDialogTitle = computed(() => verificationMode.value === 'pickup' ? '确认取货' : '确认归还')
  const verificationDialogTip = computed(() => verificationMode.value === 'pickup' ? '请输入卖方提供的取件码' : '请输入卖方提供的归还码')
  const verificationDialogPlaceholder = computed(() => verificationMode.value === 'pickup' ? '请输入取件码' : '请输入归还码')

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

  const getUserDisplayName = (user?: Order['lender'] | Order['borrower']) => {
    return user?.username || '已注销用户'
  }

  const getReviewerDisplayName = (review: Review) => {
    return review.reviewer?.username || '已注销用户'
  }

  const normalizePickupCode = (value: string) => {
    return String(value || '').trim().toUpperCase().replace(/[\s-]/g, '')
  }

  const copyContact = (value: string) => {
    uni.setClipboardData({
      data: value,
      success: () => {
        uni.showToast({ title: '复制成功', icon: 'success' })
      }
    })
  }

  const loadOrderReview = async () => {
    try {
      const res = await getOrderReview(orderId.value)
      reviews.value = res.reviews || []
      canReviewFlag.value = res.canReview
    } catch (error) {
      console.error('加载订单评价失败:', error)
      reviews.value = []
      canReviewFlag.value = false
    }
  }

  const loadOrderDetail = async () => {
    if (!orderId.value) {
      uni.showToast({ title: '订单ID无效', icon: 'none' })
      return
    }

    try {
      uni.showLoading({ title: '加载中...' })
      const res = await getOrderDetail(orderId.value)
      order.value = res.order

      if (res.order.status === 'completed') {
        await loadOrderReview()
      } else {
        reviews.value = []
        canReviewFlag.value = false
      }

      uni.hideLoading()
    } catch (error) {
      uni.hideLoading()
      uni.showToast({ title: '加载订单失败', icon: 'none' })
      console.error('加载订单详情失败:', error)
    }
  }

  const goToReview = () => {
    uni.navigateTo({
      url: `/pages/review/review?orderId=${orderId.value}`
    })
  }

  const handleApprove = async () => {
    try {
      uni.showLoading({ title: '处理中...' })
      await confirmOrder(orderId.value)
      uni.hideLoading()
      uni.showToast({ title: '已同意订单', icon: 'success' })
      await loadOrderDetail()
    } catch (error) {
      uni.hideLoading()
      uni.showToast({ title: '操作失败', icon: 'none' })
      console.error('同意订单失败:', error)
    }
  }

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
            await loadOrderDetail()
          } catch (error) {
            uni.hideLoading()
            uni.showToast({ title: '操作失败', icon: 'none' })
            console.error('拒绝订单失败:', error)
          }
        }
      }
    })
  }

  const closePickupDialog = () => {
    showPickupDialog.value = false
    pickupCodeInput.value = ''
  }

  const handlePickupCodeInput = (event: any) => {
    pickupCodeInput.value = normalizePickupCode(event?.detail?.value || '')
  }

  const submitVerificationCode = async () => {
    const verificationCode = normalizePickupCode(pickupCodeInput.value)
    if (!verificationCode) {
      uni.showToast({ title: verificationMode.value === 'pickup' ? '请输入取件码' : '请输入归还码', icon: 'none' })
      return
    }

    try {
      uni.showLoading({ title: '处理中...' })
      if (verificationMode.value === 'pickup') {
        await confirmPickup(orderId.value, verificationCode)
      } else {
        await returnOrder(orderId.value, verificationCode)
      }
      uni.hideLoading()
      closePickupDialog()
      uni.showToast({ title: verificationMode.value === 'pickup' ? '取件码已提交' : '归还码已提交', icon: 'success' })
      await loadOrderDetail()
    } catch (error: any) {
      uni.hideLoading()
      uni.showToast({ title: error?.message || (verificationMode.value === 'pickup' ? '取件失败，请检查取件码' : '归还失败，请检查归还码'), icon: 'none' })
      console.error('提交验证码失败:', error)
    }
  }

  const openVerificationDialog = (mode: 'pickup' | 'return') => {
    verificationMode.value = mode
    pickupCodeInput.value = ''
    showPickupDialog.value = true
  }

  const handleConfirmPickup = () => {
    openVerificationDialog('pickup')
  }

  const handleConfirmPickupByLender = async () => {
    uni.showModal({
      title: '确认交付',
      content: '确认已将物品当面交付给买方吗？',
      success: async (res) => {
        if (!res.confirm) return

        try {
          uni.showLoading({ title: '处理中...' })
          await confirmPickupByLender(orderId.value)
          uni.hideLoading()
          uni.showToast({ title: '已确认交付', icon: 'success' })
          await loadOrderDetail()
        } catch (error) {
          uni.hideLoading()
          uni.showToast({ title: '操作失败', icon: 'none' })
          console.error('确认交付失败:', error)
        }
      }
    })
  }

  const handleConfirmChanges = async () => {
    uni.showModal({
      title: '确认修改',
      content: '确认接受卖方修改的时间和地点吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            uni.showLoading({ title: '处理中...' })
            await confirmChanges(orderId.value)
            uni.hideLoading()
            uni.showToast({ title: '已确认修改', icon: 'success' })
            await loadOrderDetail()
          } catch (error) {
            uni.hideLoading()
            uni.showToast({ title: '操作失败', icon: 'none' })
            console.error('确认修改失败:', error)
          }
        }
      }
    })
  }

  const handleReturn = () => {
    openVerificationDialog('return')
  }

  const handleConfirmReturnByLender = async () => {
    uni.showModal({
      title: '确认收回',
      content: '确认已当面收回物品吗？',
      success: async (res) => {
        if (!res.confirm) return

        try {
          uni.showLoading({ title: '处理中...' })
          await confirmReturnByLender(orderId.value)
          uni.hideLoading()
          uni.showToast({ title: '已确认收回', icon: 'success' })
          await loadOrderDetail()
        } catch (error) {
          uni.hideLoading()
          uni.showToast({ title: '操作失败', icon: 'none' })
          console.error('确认收回失败:', error)
        }
      }
    })
  }

  const handleComplete = async () => {
    uni.showModal({
      title: '完成订单',
      content: '确认已经收回物品并完成订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            uni.showLoading({ title: '处理中...' })
            await completeOrder(orderId.value)
            uni.hideLoading()
            uni.showToast({ title: '订单已完成', icon: 'success' })
            await loadOrderDetail()
          } catch (error) {
            uni.hideLoading()
            uni.showToast({ title: '操作失败', icon: 'none' })
            console.error('完成订单失败:', error)
          }
        }
      }
    })
  }

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
            await loadOrderDetail()
          } catch (error) {
            uni.hideLoading()
            uni.showToast({ title: '操作失败', icon: 'none' })
            console.error('取消订单失败:', error)
          }
        }
      }
    })
  }

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

.order-detail,
.review-section {
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
.user-info,
.contact-info {
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
  width: 160rpx;
  flex-shrink: 0;
}

.info-value {
  font-size: 24rpx;
  color: #333333;
  flex: 1;
}

.info-value.highlight {
  color: #007aff;
  font-weight: bold;
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

.contact-item {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 10rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
}

.contact-label {
  width: 100rpx;
  font-size: 24rpx;
  color: #666;
}

.contact-value {
  flex: 1;
  font-size: 24rpx;
  color: #333;
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

.action-hint {
  width: 100%;
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

.cancel-button {
  background-color: #ff4d4f;
  color: #ffffff;
}

.approve-button,
.complete-button {
  background-color: #52c41a;
  color: #ffffff;
}

.reject-button {
  background-color: #ff4d4f;
  color: #ffffff;
}

.confirm-button,
.return-button {
  background-color: #1890ff;
  color: #ffffff;
}

.review-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.empty-review {
  color: #999;
  font-size: 24rpx;
}

.review-card {
  padding: 16rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
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

.pickup-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pickup-dialog {
  width: 82%;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-sizing: border-box;
}

.pickup-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.pickup-dialog-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.pickup-dialog-close {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
}

.pickup-dialog-tip {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.pickup-code-input {
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  background: #f6f7fb;
  border: 2rpx solid #e8ebf3;
  padding: 0 24rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 24rpx;
}

.pickup-dialog-actions {
  display: flex;
  gap: 16rpx;
}

.pickup-dialog-actions button {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  margin: 0;
}

.pickup-cancel-button {
  background: #f0f0f0;
  color: #666;
}

.pickup-confirm-button {
  background: #1890ff;
  color: #fff;
}
</style>
