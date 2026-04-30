<template>
  <view class="container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-button" @click="loadItemDetail">重新加载</button>
    </view>

    <!-- 物品详情 -->
    <view v-else-if="item" class="item-detail">
      <!-- 图片轮播 -->
      <view class="image-swiper-container">
        <swiper class="image-swiper"
                :indicator-dots="true"
                :autoplay="false"
                :circular="true">
          <swiper-item v-for="(image, index) in item.images" :key="index">
            <image class="swiper-image"
                   :src="getImageUrl(image)"
                   mode="aspectFill"
                   @error="onImageError" />
          </swiper-item>
        </swiper>
        <view v-if="!item.images || item.images.length === 0" class="no-image">
          <image class="placeholder-image" src="/static/logo.png" mode="aspectFill" />
        </view>
      </view>

      <!-- 物品基本信息 -->
      <view class="item-basic-info">
        <text class="item-title">{{ item.title }}</text>
        <view class="price-row">
          <text class="item-price">¥{{ Number(item.price).toFixed(2) }}/天</text>
          <text class="item-deposit">押金 ¥{{ Number(item.deposit).toFixed(2) }}</text>
        </view>
        <view class="item-meta">
          <text class="meta-item">{{ item.category }}</text>
          <text class="meta-item">{{ formatStatus(item.status) }}</text>
          <text class="meta-item">浏览 {{ item.viewCount }}</text>
        </view>
      </view>

      <!-- 发布者信息 -->
      <view class="owner-section">
        <view class="owner-header">
          <text class="section-title">发布者</text>
          <view v-if="isOwnItem" class="self-badge">
            <text class="self-text">本人发布</text>
          </view>
          <view v-else-if="item.user?.isVerified" class="verified-badge">
            <text class="verified-text">已认证</text>
          </view>
        </view>
        <view class="owner-info">
          <image class="owner-avatar" :src="getImageUrl(item.user?.avatar)" mode="aspectFill" />
          <view class="owner-detail">
            <text class="owner-name">{{ getItemOwnerDisplayName() }}</text>
            <view class="owner-credit">
              <text class="credit-label">信用分</text>
              <text class="credit-score">{{ item.user?.creditScore ?? 0 }}</text>
            </view>
          </view>
        </view>
        <!-- 联系方式 -->
        <view v-if="!isOwnItem" class="contact-info">
          <view class="contact-header">
            <text class="contact-title">联系方式</text>
            <text class="contact-tip">点击可复制</text>
          </view>
          <view class="contact-list">
            <view v-if="item.user?.phone" class="contact-item" @click="copyContact(item.user.phone)">
              <text class="contact-icon">📞</text>
              <text class="contact-label">手机号</text>
              <text class="contact-value">{{ item.user.phone }}</text>
              <text class="copy-icon">📋</text>
            </view>
            <view v-if="item.user?.qq" class="contact-item" @click="copyContact(item.user.qq)">
              <text class="contact-icon">💬</text>
              <text class="contact-label">QQ号</text>
              <text class="contact-value">{{ item.user.qq }}</text>
              <text class="copy-icon">📋</text>
            </view>
            <view v-if="!item.user?.phone && !item.user?.qq" class="contact-empty">
              <text class="empty-text">暂无联系方式</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 物品描述 -->
      <view class="item-description">
        <text class="section-title">物品描述</text>
        <text class="description-content">{{ item.description || '暂无描述' }}</text>
      </view>

      <!-- 物品规格 -->
      <view class="item-specs">
        <text class="section-title">物品信息</text>
        <view class="spec-item">
          <text class="spec-label">分类：</text>
          <text class="spec-value">{{ item.category || '未分类' }}</text>
        </view>
        <view class="spec-item">
          <text class="spec-label">状态：</text>
          <text class="spec-value">{{ formatStatus(item.status) }}</text>
        </view>
        <view v-if="item.location" class="spec-item">
          <text class="spec-label">位置：</text>
          <text class="spec-value">{{ item.location }}</text>
        </view>
        <view v-if="item.availableTime?.start || item.availableTime?.end" class="spec-item">
          <text class="spec-label">可借时间：</text>
          <text class="spec-value">{{ formatAvailableTime(item.availableTime) }}</text>
        </view>
        <view class="spec-item">
          <text class="spec-label">发布时间：</text>
          <text class="spec-value">{{ formatDate(item.createdAt) }}</text>
        </view>
      </view>

      <!-- 物品评价 -->
      <view class="item-reviews" v-if="reviews.length > 0 || reviewsLoading">
        <view class="reviews-header">
          <text class="section-title">用户评价</text>
          <text class="reviews-count" v-if="reviews.length > 0">({{ reviews.length }})</text>
        </view>
        
        <view v-if="reviewsLoading" class="reviews-loading">
          <text>加载中...</text>
        </view>
        
        <view v-else class="reviews-list">
          <view class="review-card" v-for="review in reviews" :key="review.id">
            <view class="review-header">
              <image class="reviewer-avatar" :src="getImageUrl(review.reviewer?.avatar)" mode="aspectFill" />
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
              <text class="review-time">{{ formatReviewTime(review.createdAt) }}</text>
            </view>
            <text class="review-content">{{ review.content }}</text>
            <view class="review-images" v-if="review.images && review.images.length > 0">
              <image 
                class="review-image" 
                v-for="(img, index) in review.images" 
                :key="index"
                :src="getImageUrl(img)"
                mode="aspectFill"
                @click="previewReviewImage(img)"
              />
            </view>
          </view>
        </view>
        
        <view class="no-reviews" v-if="!reviewsLoading && reviews.length === 0">
          <text>暂无评价</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-if="!isOwnItem">
        <button 
          class="favorite-button" 
          :class="{ 'is-favorite': isFavorite }"
          @click="toggleFavorite"
        >
          {{ isFavorite ? '取消收藏' : '收藏' }}
        </button>
        <button 
          class="chat-button" 
          :class="{ 'disabled': !canBorrow }"
          @click="contactOwner"
        >
          {{ canBorrow ? '发起交易' : '暂不可借' }}
        </button>
      </view>
    </view>

    <!-- 借用信息弹窗 -->
    <view class="borrow-dialog-mask" v-if="showBorrowDialog" @click="closeBorrowDialog">
      <view class="borrow-dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">交易信息</text>
          <text class="dialog-close" @click="closeBorrowDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="form-item">
            <text class="form-label">物品名称</text>
            <text class="form-value">{{ item?.title }}</text>
          </view>
          <view class="form-item">
            <text class="form-label">租金</text>
            <text class="form-value price">¥{{ item?.price }}/天</text>
          </view>
          <view class="form-item">
            <text class="form-label">交易时间</text>
            <view class="datetime-picker" @click="openDateTimePicker('start')">
              <text class="picker-value" :class="{ 'placeholder': !orderForm.startDate }">
                {{ orderForm.startDate ? formatDateTime(orderForm.startDate) : '请选择交易时间' }}
              </text>
              <text class="picker-arrow">></text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">交还时间</text>
            <view class="datetime-picker" @click="openDateTimePicker('end')">
              <text class="picker-value" :class="{ 'placeholder': !orderForm.endDate }">
                {{ orderForm.endDate ? formatDateTime(orderForm.endDate) : '请选择交还时间' }}
              </text>
              <text class="picker-arrow">></text>
            </view>
          </view>
          <view class="form-item" v-if="orderForm.startDate && orderForm.endDate">
            <text class="form-label">预计交易时长</text>
            <text class="form-value duration">{{ calculateDuration }}</text>
          </view>
          <view class="form-item">
            <text class="form-label">取货地点</text>
            <input
              class="form-input"
              v-model="orderForm.pickupLocation"
              placeholder="请输入取货地点"
            >
          </view>
          <view class="form-item">
            <text class="form-label">还货地点</text>
            <input
              class="form-input"
              v-model="orderForm.returnLocation"
              placeholder="请输入还货地点"
            >
          </view>
          <view class="form-item">
            <text class="form-label">备注信息</text>
            <textarea 
              class="form-textarea" 
              v-model="orderForm.note" 
              placeholder="请输入备注信息（可选）"
              maxlength="200"
            />
          </view>
        </view>
        <view class="dialog-footer">
          <button class="btn-cancel" @click="closeBorrowDialog">取消</button>
          <button class="btn-confirm" @click="submitOrder" :disabled="!canSubmit">确认交易</button>
        </view>
      </view>
    </view>

    <!-- 日期时间选择器 -->
    <view class="datetime-picker-mask" v-if="showDateTimePicker" @click="closeDateTimePicker">
      <view class="datetime-picker-container" @click.stop>
        <view class="picker-header">
          <text class="picker-cancel" @click="closeDateTimePicker">取消</text>
          <text class="picker-title">选择{{ pickerType === 'start' ? '交易' : '交还' }}时间</text>
          <text class="picker-confirm" @click="confirmDateTime">确定</text>
        </view>
        <view class="picker-view-container">
          <picker-view class="picker-view" :value="pickerValue" @change="onPickerChange">
            <picker-view-column>
              <view class="picker-item" v-for="year in years" :key="year">{{ year }}年</view>
            </picker-view-column>
            <picker-view-column>
              <view class="picker-item" v-for="month in months" :key="month">{{ month }}月</view>
            </picker-view-column>
            <picker-view-column>
              <view class="picker-item" v-for="day in days" :key="day">{{ day }}日</view>
            </picker-view-column>
            <picker-view-column>
              <view class="picker-item" v-for="hour in hours" :key="hour">{{ hour }}时</view>
            </picker-view-column>
            <picker-view-column>
              <view class="picker-item" v-for="minute in minutes" :key="minute">{{ minute }}分</view>
            </picker-view-column>
          </picker-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getItemDetail, type Item } from '@/api/items'
  import { createOrder, type CreateOrderParams } from '@/api/orders'
  import { getItemReviews, type Review } from '@/api/reviews'
  import { addFavorite, removeFavorite, checkFavoriteStatus } from '@/api/favorites'
  import { useAuthStore } from '@/stores/auth'
  import { formatItemStatus, canBorrow as canBorrowItem } from '@/utils/constants'
  import { checkLogin } from '@/utils/auth'
  import { getImageUrl } from '@/utils/image'

  const authStore = useAuthStore()

  // 收藏状态
  const isFavorite = ref(false)
  const favoriteLoading = ref(false)

  // 弹窗显示状态
  const showBorrowDialog = ref(false)
  const showDateTimePicker = ref(false)
  const pickerType = ref<'start' | 'end'>('start')

  // 订单表单
  const orderForm = ref({
    startDate: '',
    endDate: '',
    pickupLocation: '',
    returnLocation: '',
    note: ''
  })

  // 日期时间选择器数据
  const years = ref<string[]>([])
  const months = ref<string[]>([])
  const days = ref<string[]>([])
  const hours = ref<string[]>([])
  const minutes = ref<string[]>([])
  const pickerValue = ref<number[]>([0, 0, 0, 0, 0])
  const tempPickerValue = ref<number[]>([0, 0, 0, 0, 0])

  // 物品 ID
  const itemId = ref<number>(0)
  // 物品数据
  const item = ref<Item | null>(null)
  // 评价数据
  const reviews = ref<Review[]>([])
  // 加载状态
  const loading = ref(false)
  // 评价加载状态
  const reviewsLoading = ref(false)
  // 错误信息
  const error = ref('')

  // 计算属性：是否可以借用
  const canBorrow = computed(() => {
    return item.value ? canBorrowItem(item.value.status) : false
  })

  // 计算属性：是否可以提交订单
  const canSubmit = computed(() => {
    return orderForm.value.startDate && orderForm.value.endDate
  })

  // 计算属性：是否是本人发布的物品
  const isOwnItem = computed(() => {
    if (!item.value || !item.value.user || !authStore.userInfo) {
      return false
    }
    const itemUserId = String(item.value.user.id)
    const currentUserId = String(authStore.userInfo.id)
    return itemUserId === currentUserId
  })

  // 计算属性：计算借用时长
  const calculateDuration = computed(() => {
    if (!orderForm.value.startDate || !orderForm.value.endDate) return ''
    const start = new Date(orderForm.value.startDate)
    const end = new Date(orderForm.value.endDate)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 1) return '不足1天'
    return `${diffDays}天`
  })

  // 初始化日期时间选择器数据
  const initPickerData = () => {
    const currentYear = new Date().getFullYear()
    // 生成年份（当前年到后2年）
    years.value = Array.from({ length: 3 }, (_, i) => String(currentYear + i))
    // 生成月份
    months.value = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
    // 生成日期（根据年月动态生成）
    updateDays()
    // 生成小时
    hours.value = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
    // 生成分钟
    minutes.value = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  }

  // 更新日期列表
  const updateDays = () => {
    const year = parseInt(String(years.value[pickerValue.value[0]] || new Date().getFullYear()))
    const month = parseInt(String(months.value[pickerValue.value[1]] || 1))
    const daysInMonth = new Date(year, month, 0).getDate()
    days.value = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'))
  }

  // 图片加载失败处理
  const onImageError = () => {}

  // 格式化状态
  const formatStatus = (status: string): string => {
    return formatItemStatus(status)
  }

  // 格式化可借时间
  const formatAvailableTime = (time: { start?: string; end?: string }): string => {
    if (time.start && time.end) {
      return `${formatDate(time.start)} 至 ${formatDate(time.end)}`
    } else if (time.start) {
      return `从 ${formatDate(time.start)} 开始`
    } else if (time.end) {
      return `至 ${formatDate(time.end)} 结束`
    }
    return '随时可借'
  }

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  }

  // 格式化日期时间
  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  // 格式化评价时间
  const formatReviewTime = (time: string): string => {
    if (!time) return ''
    const date = new Date(time)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    } else if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }

  const getItemOwnerDisplayName = () => {
    return item.value?.user?.username || '已注销用户'
  }

  const getReviewerDisplayName = (review: Review) => {
    return review.reviewer?.username || '已注销用户'
  }

  // 预览评价图片
  const previewReviewImage = (url: string) => {
    const normalizedUrl = getImageUrl(url)
    uni.previewImage({
      urls: [normalizedUrl],
      current: normalizedUrl
    })
  }

  // 加载物品评价
  const loadReviews = async () => {
    if (!itemId.value) return
  
    reviewsLoading.value = true
  
    try {
      const res = await getItemReviews(itemId.value, { page: 1, limit: 5 })
      reviews.value = res.reviews || []
    } catch (error) {
      console.error('获取物品评价失败:', error)
    } finally {
      reviewsLoading.value = false
    }
  }

  // 加载物品详情
  const loadItemDetail = async () => {
    if (!itemId.value) {
      error.value = '物品ID无效'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const res = await getItemDetail(itemId.value)
      if (res.item) {
        item.value = res.item
        // 加载评价
        await loadReviews()
      } else {
        error.value = '物品不存在'
      }
    } catch (err: any) {
      console.error('获取物品详情失败:', err)
      error.value = err.message || '获取物品详情失败，请稍后重试'
    } finally {
      loading.value = false
    }
  }

  // 检查收藏状态
  const checkFavorite = async () => {
    if (!authStore.isLoggedIn || !itemId.value) return
  
    try {
      const res = await checkFavoriteStatus(itemId.value)
      isFavorite.value = res.isFavorite
    } catch (error) {
      console.error('检查收藏状态失败:', error)
    }
  }

  // 切换收藏状态
  const toggleFavorite = async () => {
    if (!checkLogin()) return
  
    if (favoriteLoading.value) return
  
    favoriteLoading.value = true
  
    try {
      if (isFavorite.value) {
        await removeFavorite(itemId.value)
        isFavorite.value = false
        uni.showToast({ title: '已取消收藏', icon: 'success' })
      } else {
        await addFavorite(itemId.value)
        isFavorite.value = true
        uni.showToast({ title: '收藏成功', icon: 'success' })
      }
    } catch (error: any) {
      console.error('收藏操作失败:', error)
      uni.showToast({ title: error.message || '操作失败', icon: 'none' })
    } finally {
      favoriteLoading.value = false
    }
  }

  // 复制联系方式
  const copyContact = (value: string) => {
    uni.setClipboardData({
      data: value,
      success: () => {
        uni.showToast({ title: '复制成功', icon: 'success' })
      },
      fail: () => {
        uni.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  }

  // 联系发布者（跳转到交易流程）
  const contactOwner = async () => {
    if (!checkLogin()) return

    await loadItemDetail()

    if (!canBorrow.value) {
      uni.showToast({ title: '该物品当前不可借用', icon: 'none' })
      return
    }

    openBorrowDialog()
  }

  // 打开借用弹窗
  const openBorrowDialog = () => {
    if (!canBorrow.value) return
    if (!checkLogin()) return
    if (!item.value) return

    // 初始化默认时间
    const now = new Date()
    const startDate = new Date(now)
    startDate.setMinutes(0, 0, 0)
    startDate.setHours(startDate.getHours() + 1)
  
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)
  
    orderForm.value.startDate = startDate.toISOString()
    orderForm.value.endDate = endDate.toISOString()
    orderForm.value.pickupLocation = item.value.location || ''
    orderForm.value.returnLocation = item.value.location || ''
    orderForm.value.note = ''

    showBorrowDialog.value = true
  }

  // 关闭借用弹窗
  const closeBorrowDialog = () => {
    showBorrowDialog.value = false
  }

  // 打开日期时间选择器
  const openDateTimePicker = (type: 'start' | 'end') => {
    pickerType.value = type
    initPickerData()
  
    // 根据当前选择的值设置 picker
    const currentDate = type === 'start' 
      ? (orderForm.value.startDate ? new Date(orderForm.value.startDate) : new Date())
      : (orderForm.value.endDate ? new Date(orderForm.value.endDate) : new Date())
  
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const day = currentDate.getDate() - 1
    const hour = currentDate.getHours()
    const minute = currentDate.getMinutes()
  
    const yearIndex = years.value.findIndex(y => parseInt(y) === year)
    pickerValue.value = [
      yearIndex >= 0 ? yearIndex : 0,
      month,
      day,
      hour,
      minute
    ]
    tempPickerValue.value = [...pickerValue.value]
  
    updateDays()
    showDateTimePicker.value = true
  }

  // 关闭日期时间选择器
  const closeDateTimePicker = () => {
    showDateTimePicker.value = false
  }

  // picker 值改变
  const onPickerChange = (e: any) => {
    tempPickerValue.value = e.detail.value
    // 如果年份或月份改变，更新日期
    if (tempPickerValue.value[0] !== pickerValue.value[0] || tempPickerValue.value[1] !== pickerValue.value[1]) {
      pickerValue.value = [...tempPickerValue.value]
      updateDays()
    }
  }

  // 确认日期时间选择
  const confirmDateTime = () => {
    const year = parseInt(years.value[tempPickerValue.value[0]])
    const month = parseInt(months.value[tempPickerValue.value[1]])
    const day = parseInt(days.value[tempPickerValue.value[2]] || '1')
    const hour = parseInt(hours.value[tempPickerValue.value[3]])
    const minute = parseInt(minutes.value[tempPickerValue.value[4]])
  
    const selectedDate = new Date(year, month - 1, day, hour, minute)
  
    // 验证时间
    const now = new Date()
    if (pickerType.value === 'start' && selectedDate < now) {
      uni.showToast({ title: '交易时间不能早于当前时间', icon: 'none' })
      return
    }

    if (pickerType.value === 'end' && orderForm.value.startDate) {
      const startDate = new Date(orderForm.value.startDate)
      if (selectedDate <= startDate) {
        uni.showToast({ title: '交还时间必须晚于交易时间', icon: 'none' })
        return
      }
    }
  
    if (pickerType.value === 'start') {
      orderForm.value.startDate = selectedDate.toISOString()
      // 如果结束时间早于新的开始时间，清空结束时间
      if (orderForm.value.endDate) {
        const endDate = new Date(orderForm.value.endDate)
        if (endDate <= selectedDate) {
          const newEndDate = new Date(selectedDate)
          newEndDate.setDate(newEndDate.getDate() + 1)
          orderForm.value.endDate = newEndDate.toISOString()
        }
      }
    } else {
      orderForm.value.endDate = selectedDate.toISOString()
    }
  
    closeDateTimePicker()
  }

  // 提交订单
  const submitOrder = async () => {
    if (!orderForm.value.startDate || !orderForm.value.endDate) {
      uni.showToast({ title: '请选择交易时间和交还时间', icon: 'none' })
      return
    }

    const startDate = new Date(orderForm.value.startDate)
    const endDate = new Date(orderForm.value.endDate)

    if (endDate <= startDate) {
      uni.showToast({ title: '交还时间必须晚于交易时间', icon: 'none' })
      return
    }
  
    try {
      const params: CreateOrderParams = {
        itemId: itemId.value,
        startDate: orderForm.value.startDate,
        endDate: orderForm.value.endDate,
        pickupLocation: orderForm.value.pickupLocation || undefined,
        returnLocation: orderForm.value.returnLocation || undefined,
        note: orderForm.value.note || undefined
      }
      await createOrder(params)
      uni.showToast({ title: '交易请求已提交', icon: 'success' })
      closeBorrowDialog()
      setTimeout(() => {
        uni.switchTab({ url: '/pages/orders/orders' })
      }, 1500)
    } catch (error: any) {
      if (error?.message === 'Item is not available') {
        closeBorrowDialog()
        await loadItemDetail()
        uni.showToast({ title: '物品状态已变化，请重新确认', icon: 'none' })
        return
      }

      uni.showToast({ title: error?.message || '提交失败，请重试', icon: 'none' })
    }
  }

  // 页面加载
  onLoad((options) => {
    const id = options?.id
    if (id) {
      itemId.value = parseInt(id, 10)
      loadItemDetail().then(() => {
        checkFavorite()
      })
    } else {
      error.value = '缺少物品ID参数'
    }
  })
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

/* 加载状态 */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
}

.error-text {
  font-size: 28rpx;
  color: #ff4d4f;
  margin-bottom: 32rpx;
  text-align: center;
}

.retry-button {
  width: 240rpx;
  height: 72rpx;
  line-height: 72rpx;
  background-color: #007aff;
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 36rpx;
}

/* 图片轮播 */
.image-swiper-container {
  position: relative;
  width: 100%;
  height: 600rpx;
  background-color: #f0f0f0;
}

.image-swiper {
  width: 100%;
  height: 100%;
}

.swiper-image {
  width: 100%;
  height: 100%;
}

.no-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-image {
  width: 200rpx;
  height: 200rpx;
  opacity: 0.5;
}

/* 物品基本信息 */
.item-basic-info {
  background-color: #ffffff;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.item-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
  display: block;
  line-height: 1.4;
}

.price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 16rpx;
}

.item-price {
  font-size: 40rpx;
  color: #ff4d4f;
  font-weight: bold;
  margin-right: 24rpx;
}

.item-deposit {
  font-size: 24rpx;
  color: #666666;
}

.item-meta {
  display: flex;
  gap: 24rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #999999;
  background-color: #f5f5f5;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

/* 发布者信息 */
.owner-section {
  background-color: #ffffff;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.owner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.verified-badge {
  background-color: #52c41a;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.verified-text {
  font-size: 20rpx;
  color: #ffffff;
}

.self-badge {
  background-color: #1890ff;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.self-text {
  font-size: 20rpx;
  color: #ffffff;
}

.owner-info {
  display: flex;
  align-items: center;
}

.owner-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  background-color: #f0f0f0;
}

.owner-detail {
  flex: 1;
}

.owner-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 8rpx;
  display: block;
}

.owner-credit {
  display: flex;
  align-items: center;
}

.credit-label {
  font-size: 22rpx;
  color: #999999;
  margin-right: 8rpx;
}

.credit-score {
  font-size: 22rpx;
  color: #ff9500;
  font-weight: bold;
}

/* 联系方式 */
.contact-info {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx dashed #e5e5e5;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.contact-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333333;
}

.contact-tip {
  font-size: 22rpx;
  color: #999999;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
}

.contact-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.contact-label {
  font-size: 24rpx;
  color: #666666;
  width: 80rpx;
}

.contact-value {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.copy-icon {
  font-size: 28rpx;
  opacity: 0.6;
}

/* 物品描述 */
.item-description {
  background-color: #ffffff;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
  display: block;
}

.description-content {
  font-size: 26rpx;
  line-height: 1.8;
  color: #666666;
}

/* 物品规格 */
.item-specs {
  background-color: #ffffff;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.spec-item {
  display: flex;
  margin-bottom: 16rpx;
}

.spec-item:last-child {
  margin-bottom: 0;
}

.spec-label {
  font-size: 26rpx;
  color: #999999;
  width: 160rpx;
  flex-shrink: 0;
}

.spec-value {
  font-size: 26rpx;
  color: #333333;
  flex: 1;
}

/* 操作按钮 */
.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.favorite-button {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
  color: #ffffff;
  font-size: 28rpx;
  border: none;
}

.favorite-button.is-favorite {
  background: linear-gradient(135deg, #999999 0%, #666666 100%);
}

.chat-button {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
  color: #ffffff;
  font-size: 28rpx;
  border: none;
}

.chat-button.disabled {
  background: linear-gradient(135deg, #cccccc 0%, #999999 100%);
  pointer-events: none;
}

/* 物品评价 */
.item-reviews {
  background-color: #ffffff;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.reviews-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.reviews-count {
  font-size: 24rpx;
  color: #999;
  margin-left: 8rpx;
}

.reviews-loading,
.no-reviews {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.review-card {
  padding: 16rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}

.review-card .review-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.review-card .reviewer-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.review-card .reviewer-info {
  flex: 1;
}

.review-card .reviewer-name {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 4rpx;
}

.review-card .review-rating {
  display: flex;
}

.review-card .review-rating .star {
  font-size: 22rpx;
  color: #ddd;
  margin-right: 2rpx;
}

.review-card .review-rating .star.active {
  color: #ffb800;
}

.review-card .review-time {
  font-size: 22rpx;
  color: #999;
}

.review-card .review-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.review-card .review-images {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.review-card .review-image {
  width: 140rpx;
  height: 140rpx;
  border-radius: 8rpx;
}

/* 借用弹窗 */
.borrow-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.borrow-dialog {
  width: 80%;
  max-width: 600rpx;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.dialog-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
  padding: 0 8rpx;
}

.dialog-content {
  padding: 32rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 12rpx;
  display: block;
}

.form-value {
  font-size: 28rpx;
  color: #333333;
}

.form-value.price {
  color: #ff4d4f;
  font-weight: bold;
}

.form-value.duration {
  color: #007aff;
  font-weight: 500;
}

.datetime-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  border: 2rpx solid #e5e5e5;
}

.picker-value {
  font-size: 28rpx;
  color: #333333;
}

.picker-value.placeholder {
  color: #999999;
}

.picker-arrow {
  font-size: 28rpx;
  color: #999999;
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  padding: 20rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  border: 2rpx solid #e5e5e5;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  border: 2rpx solid #e5e5e5;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.dialog-footer {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 2rpx solid #f0f0f0;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: #666666;
}

.btn-confirm {
  background-color: #007aff;
  color: #ffffff;
}

.btn-confirm[disabled] {
  background-color: #cccccc;
  color: #ffffff;
}

/* 日期时间选择器 */
.datetime-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 1001;
}

.datetime-picker-container {
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.picker-cancel {
  font-size: 28rpx;
  color: #999999;
}

.picker-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.picker-confirm {
  font-size: 28rpx;
  color: #007aff;
  font-weight: 500;
}

.picker-view-container {
  height: 400rpx;
}

.picker-view {
  height: 100%;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #333333;
  height: 80rpx;
}
</style>
