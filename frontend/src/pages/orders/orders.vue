<template>
  <view class="orders-container">
    <!-- 角色切换标签 -->
    <view class="role-tabs">
      <view 
        class="role-tab" 
        :class="{ active: currentRole === 'borrower' }"
        @click="selectRole('borrower')"
      >
        我借入的
      </view>
      <view 
        class="role-tab" 
        :class="{ active: currentRole === 'lender' }"
        @click="selectRole('lender')"
      >
        我借出的
      </view>
    </view>

    <!-- 订单类型标签 -->
    <view class="order-tabs">
      <view 
        class="tab-item" 
        v-for="tab in tabs" 
        :key="tab.value"
        :class="{ active: currentTab === tab.value }"
        @click="selectTab(tab.value)"
      >
        {{ tab.label }}
        <text class="badge" v-if="tab.count > 0">{{ tab.count }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view 
      class="orders-scroll" 
      scroll-y 
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="order-list">
        <view 
          class="order-card" 
          v-for="order in orders" 
          :key="order.id"
          @click="goToDetail(order.id)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <text class="order-no">订单号: {{ order.id }}</text>
            <text class="order-status" :class="order.status">{{ getStatusText(order.status) }}</text>
          </view>

          <!-- 订单内容 -->
          <view class="order-content">
            <image class="item-image" :src="order.item?.images?.[0] || '/static/logo.png'" mode="aspectFill" />
            <view class="item-info">
              <text class="item-title">{{ order.item?.title || '未知物品' }}</text>
              <text class="item-time">{{ formatTime(order.startDate) }} - {{ formatTime(order.endDate) }}</text>
              <view class="item-price">
                <text class="rent-price">租金: ¥{{ order.totalPrice }}</text>
                <text class="deposit-price">押金: ¥{{ order.deposit }}</text>
              </view>
            </view>
          </view>

          <!-- 订单底部 -->
          <view class="order-footer">
            <view class="user-info">
              <image class="user-avatar" :src="getOtherUser(order)?.avatar || '/static/logo.png'" />
              <text class="user-name">{{ getOtherUser(order)?.username || '未知用户' }}</text>
            </view>
            <view class="order-actions">
              <button 
                class="action-btn primary" 
                v-if="showPrimaryAction(order)"
                @click.stop="handlePrimaryAction(order)"
              >
                {{ getPrimaryActionText(order) }}
              </button>
              <button 
                class="action-btn" 
                v-if="showSecondaryAction(order)"
                @click.stop="handleSecondaryAction(order)"
              >
                {{ getSecondaryActionText(order) }}
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && orders.length > 0">
        <text>没有更多了</text>
      </view>
      <view class="empty" v-if="orders.length === 0 && !loading">
        <image class="empty-icon" src="/static/logo.png" />
        <text class="empty-text">暂无订单</text>
        <text class="empty-tip">快去浏览物品吧</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getOrderList, getOrderStats, type Order, approveOrder, rejectOrder, confirmPickup, completeOrder, cancelOrder } from '@/api/orders'
  import { useAuthStore } from '@/stores/auth'
  import { isLoggedIn } from '@/utils/auth'

  const authStore = useAuthStore()

  // 从authStore获取当前用户ID
  const currentUserId = computed(() => {
    return authStore.userInfo?.id || 0
  })

  // 角色切换：borrower = 我借入的, lender = 我借出的
  const currentRole = ref<'borrower' | 'lender'>('borrower')

  const tabs = [
    { label: '全部', value: 'all', count: 0 },
    { label: '待处理', value: 'pending', count: 0 },
    { label: '进行中', value: 'in_progress', count: 0 },
    { label: '已完成', value: 'completed', count: 0 }
  ]
  const currentTab = ref('all')

  const orders = ref<Order[]>([])
  const loading = ref(false)
  const refreshing = ref(false)
  const hasMore = ref(true)
  const page = ref(1)
  const limit = 10

  onMounted(() => {
    if (!isLoggedIn()) {
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    loadOrderStats()
    loadOrders()
  })

  onShow(() => {
    if (!isLoggedIn()) {
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    const savedRole = uni.getStorageSync('orderRole')
    if (savedRole && (savedRole === 'lender' || savedRole === 'borrower')) {
      if (currentRole.value !== savedRole) {
        currentRole.value = savedRole
        page.value = 1
        orders.value = []
        hasMore.value = true
        loadOrders()
      }
      uni.removeStorageSync('orderRole')
    }
  })

  // 加载订单统计
  const loadOrderStats = async () => {
    try {
      const stats = await getOrderStats()
      tabs[0].count = 0
      tabs[1].count = stats.pendingCount || 0
      tabs[2].count = stats.inProgressCount || 0
      tabs[3].count = stats.completedCount || 0
    } catch (error) {
      console.error('获取订单统计失败:', error)
    }
  }

  // 加载订单列表
  const loadOrders = async () => {
    if (loading.value) return
  
    loading.value = true
  
    try {
      const params: { page: number; limit: number; status?: string; role?: 'lender' | 'borrower' } = {
        page: page.value,
        limit: limit,
        role: currentRole.value
      }
    
      // 根据当前标签添加状态筛选
      if (currentTab.value !== 'all') {
        if (currentTab.value === 'pending') {
          params.status = 'pending'
        } else if (currentTab.value === 'in_progress') {
          params.status = 'in_progress'
        } else if (currentTab.value === 'completed') {
          params.status = 'completed'
        }
      }
    
      const res = await getOrderList(params)
    
      if (page.value === 1) {
        orders.value = res.orders || []
      } else {
        orders.value = [...orders.value, ...(res.orders || [])]
      }
    
      // 判断是否还有更多数据
      hasMore.value = res.orders?.length === limit && page.value < (res.pagination?.totalPages || 1)
    } catch (error) {
      console.error('获取订单列表失败:', error)
      uni.showToast({ title: '获取订单失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }

  // 切换角色
  const selectRole = (role: 'borrower' | 'lender') => {
    currentRole.value = role
    page.value = 1
    orders.value = []
    hasMore.value = true
    loadOrders()
  }

  // 切换标签
  const selectTab = (tab: string) => {
    currentTab.value = tab
    page.value = 1
    orders.value = []
    hasMore.value = true
    loadOrders()
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      approved: '已同意',
      rejected: '已拒绝',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return statusMap[status] || status
  }

  // 格式化时间
  const formatTime = (time: string) => {
    if (!time) return ''
    const date = new Date(time)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 获取对方用户信息
  const getOtherUser = (order: Order) => {
    if (!currentUserId.value) return order.lender
    return order.lenderId === currentUserId.value ? order.borrower : order.lender
  }

  // 是否显示主要操作按钮
  const showPrimaryAction = (order: Order) => {
    const actions = ['pending', 'approved', 'in_progress']
    return actions.includes(order.status)
  }

  // 获取主要操作按钮文本
  const getPrimaryActionText = (order: Order) => {
    const isLender = order.lenderId === currentUserId.value
    const actionMap: Record<string, string> = {
      pending: isLender ? '同意' : '取消',
      approved: isLender ? '等待取货' : '确认取货',
      in_progress: isLender ? '等待归还' : '确认归还'
    }
    return actionMap[order.status] || '处理'
  }

  // 处理主要操作
  const handlePrimaryAction = async (order: Order) => {
    const isLender = order.lenderId === currentUserId.value
  
    try {
      if (order.status === 'pending') {
        if (isLender) {
          // 同意订单
          await approveOrder(order.id)
          uni.showToast({ title: '已同意订单', icon: 'success' })
        } else {
          // 取消订单
          await cancelOrder(order.id)
          uni.showToast({ title: '已取消订单', icon: 'success' })
        }
      } else if (order.status === 'approved') {
        if (!isLender) {
          // 确认取货
          await confirmPickup(order.id)
          uni.showToast({ title: '已确认取货', icon: 'success' })
        }
      } else if (order.status === 'in_progress') {
        if (isLender) {
          // 出借方等待归还
          uni.showToast({ title: '等待借入方归还', icon: 'none' })
          return
        } else {
          // 确认归还
          await completeOrder(order.id)
          uni.showToast({ title: '已确认归还', icon: 'success' })
        }
      }
      // 刷新订单列表
      onRefresh()
    } catch (error: any) {
      uni.showToast({ title: error?.message || '操作失败', icon: 'none' })
    }
  }

  // 是否显示次要操作按钮
  const showSecondaryAction = (order: Order) => {
    return order.status === 'pending' || order.status === 'approved' || order.status === 'in_progress'
  }

  // 获取次要操作按钮文本
  const getSecondaryActionText = (order: Order) => {
    const isLender = order.lenderId === currentUserId.value
    if (order.status === 'pending' && isLender) {
      return '拒绝'
    }
    return '联系对方'
  }

  // 处理次要操作
  const handleSecondaryAction = async (order: Order) => {
    const isLender = order.lenderId === currentUserId.value
  
    if (order.status === 'pending' && isLender) {
      // 拒绝订单
      try {
        await rejectOrder(order.id)
        uni.showToast({ title: '已拒绝订单', icon: 'success' })
        onRefresh()
      } catch (error: any) {
        uni.showToast({ title: error?.message || '操作失败', icon: 'none' })
      }
    } else {
      // 联系对方
      const otherUser = getOtherUser(order)
      if (otherUser?.id) {
        uni.navigateTo({
          url: `/pages/chat/chat?userId=${otherUser.id}`
        })
      } else {
        uni.showToast({ title: '无法联系对方', icon: 'none' })
      }
    }
  }

  // 加载更多
  const loadMore = () => {
    if (!hasMore.value || loading.value) return
  
    page.value++
    loadOrders()
  }

  // 下拉刷新
  const onRefresh = async () => {
    refreshing.value = true
    page.value = 1
    hasMore.value = true
  
    await loadOrderStats()
    await loadOrders()
  
    refreshing.value = false
  }

  // 跳转到订单详情
  const goToDetail = (id: number) => {
    uni.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    })
  }
</script>

<style lang="scss">
.orders-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.role-tabs {
  display: flex;
  background-color: #fff;
  padding: 0 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.role-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.role-tab.active {
  color: #007aff;
  font-weight: 500;
}

.role-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #007aff;
  border-radius: 2rpx;
}

.order-tabs {
  display: flex;
  background-color: #fff;
  padding: 0 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #007aff;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background-color: #007aff;
  border-radius: 2rpx;
}

.badge {
  display: inline-block;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
  margin-left: 8rpx;
}

.orders-scroll {
  flex: 1;
  padding: 20rpx;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-no {
  font-size: 24rpx;
  color: #999;
}

.order-status {
  font-size: 26rpx;
  font-weight: 500;
}

.order-status.pending {
  color: #faad14;
}

.order-status.approved {
  color: #1890ff;
}

.order-status.rejected {
  color: #ff4d4f;
}

.order-status.in_progress {
  color: #722ed1;
}

.order-status.completed {
  color: #52c41a;
}

.order-status.cancelled {
  color: #999;
}

.order-content {
  display: flex;
  margin-bottom: 20rpx;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.item-time {
  font-size: 24rpx;
  color: #666;
}

.item-price {
  display: flex;
  gap: 20rpx;
}

.rent-price {
  font-size: 28rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.deposit-price {
  font-size: 24rpx;
  color: #999;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.user-name {
  font-size: 26rpx;
  color: #666;
}

.order-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  border: none;
}

.action-btn.primary {
  color: #fff;
  background-color: #007aff;
}

.action-btn::after {
  border: none;
}

.load-more,
.no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}
</style>
