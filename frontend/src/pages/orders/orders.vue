<template>
  <view class="orders-container">
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
          <view class="order-header">
            <text class="order-no">订单号: {{ order.id }}</text>
            <text class="order-status" :class="order.status">{{ getStatusText(order) }}</text>
          </view>

          <view class="order-content">
            <image class="item-image" :src="getImageUrl(order.item?.images?.[0])" mode="aspectFill" />
            <view class="item-info">
              <text class="item-title">{{ order.item?.title || '未知物品' }}</text>
              <text class="item-time">交易 {{ formatTime(order.startDate) }} · 交还 {{ formatTime(order.endDate) }}</text>
              <view class="item-price">
                <text class="rent-price">租金: ¥{{ order.totalPrice }}</text>
                <text class="deposit-price">押金: ¥{{ order.deposit }}</text>
              </view>
            </view>
          </view>

          <view class="order-footer">
            <view class="user-info">
              <image class="user-avatar" :src="getImageUrl(getOtherUser(order)?.avatar)" />
              <text class="user-name">{{ getUserDisplayName(getOtherUser(order)) }}</text>
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
  import { ref, onMounted, computed, reactive } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getOrderList, getOrderStats, type Order, confirmOrder, rejectOrder, cancelOrder } from '@/api/orders'
  import { useAuthStore } from '@/stores/auth'
  import { isLoggedIn } from '@/utils/auth'
  import { getImageUrl } from '@/utils/image'

  const authStore = useAuthStore()

  const currentUserId = computed(() => {
    return authStore.userInfo?.id || 0
  })

  const currentRole = ref<'borrower' | 'lender'>('borrower')

  const tabs = reactive([
    { label: '全部', value: 'all', count: 0 },
    { label: '待处理', value: 'pending', count: 0 },
    { label: '进行中', value: 'active', count: 0 },
    { label: '已完成', value: 'completed', count: 0 }
  ])
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
      }
      uni.removeStorageSync('orderRole')
    }
    onRefresh()
  })

  const loadOrderStats = async () => {
    try {
      const stats = await getOrderStats()
      tabs[0].count = 0
      tabs[1].count = stats.pendingCount || 0
      tabs[2].count = (stats.confirmedCount || 0) + (stats.usingCount || 0) + (stats.returnedCount || 0)
      tabs[3].count = stats.completedCount || 0
    } catch (error) {
      console.error('获取订单统计失败:', error)
    }
  }

  const getStatusFilter = () => {
    if (currentTab.value === 'pending') {
      return 'pending'
    }

    if (currentTab.value === 'active') {
      return 'confirmed,using,returned'
    }

    if (currentTab.value === 'completed') {
      return 'completed'
    }

    return undefined
  }

  const loadOrders = async () => {
    if (loading.value) return

    loading.value = true

    try {
      const params: { page: number; limit: number; status?: string; role?: 'lender' | 'borrower' } = {
        page: page.value,
        limit,
        role: currentRole.value
      }

      const statusFilter = getStatusFilter()
      if (statusFilter) {
        params.status = statusFilter
      }

      const res = await getOrderList(params)
      const nextOrders = res.orders || []

      if (page.value === 1) {
        orders.value = nextOrders
      } else {
        orders.value = [...orders.value, ...nextOrders]
      }

      hasMore.value = nextOrders.length === limit && page.value < (res.pagination?.totalPages || 1)
    } catch (error) {
      console.error('获取订单列表失败:', error)
      uni.showToast({ title: '获取订单失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }

  const selectRole = (role: 'borrower' | 'lender') => {
    currentRole.value = role
    page.value = 1
    orders.value = []
    hasMore.value = true
    loadOrders()
  }

  const selectTab = (tab: string) => {
    currentTab.value = tab
    page.value = 1
    orders.value = []
    hasMore.value = true
    loadOrders()
  }

  const getStatusText = (order: Order) => {
    if (order.status === 'confirmed') {
      return order.pickupCodeVerifiedAt && !order.pickupConfirmedByLenderAt ? '待卖方确认交付' : '待取货'
    }

    if (order.status === 'using') {
      return order.returnCodeVerifiedAt && !order.returnConfirmedByLenderAt ? '待卖方确认收回' : '使用中'
    }

    if (order.status === 'returned') {
      return '待完成'
    }

    const statusMap: Record<string, string> = {
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消'
    }
    return statusMap[order.status] || order.status
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const date = new Date(time)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getOtherUser = (order: Order) => {
    if (!currentUserId.value) return order.lender
    return order.lenderId === currentUserId.value ? order.borrower : order.lender
  }

  const getUserDisplayName = (user?: Order['lender'] | Order['borrower']) => {
    return user?.username || '已注销用户'
  }

  const showPrimaryAction = (order: Order) => {
    const isLender = order.lenderId === currentUserId.value

    if (order.status === 'pending') return true
    if (['confirmed', 'using', 'returned'].includes(order.status)) return true
    if (order.status === 'completed' && isLender) return true

    return false
  }

  const getPrimaryActionText = (order: Order) => {
    const isLender = order.lenderId === currentUserId.value

    if (order.status === 'pending') {
      return isLender ? '同意' : '取消'
    }

    if (['confirmed', 'using', 'returned'].includes(order.status)) {
      return '去处理'
    }

    if (order.status === 'completed' && isLender) {
      return '查看详情'
    }

    return '查看详情'
  }

  const handlePrimaryAction = async (order: Order) => {
    const isLender = order.lenderId === currentUserId.value

    try {
      if (order.status === 'pending') {
        if (isLender) {
          await confirmOrder(order.id)
          uni.showToast({ title: '已同意订单', icon: 'success' })
        } else {
          await cancelOrder(order.id)
          uni.showToast({ title: '已取消订单', icon: 'success' })
        }

        await onRefresh()
        return
      }

      uni.navigateTo({
        url: `/pages/order-detail/order-detail?id=${order.id}`
      })
    } catch (error: any) {
      uni.showToast({ title: error?.message || '操作失败', icon: 'none' })
    }
  }

  const showSecondaryAction = (order: Order) => {
    const isLender = order.lenderId === currentUserId.value
    return order.status === 'pending' && isLender
  }

  const getSecondaryActionText = (_order: Order) => {
    return '拒绝'
  }

  const handleSecondaryAction = async (order: Order) => {
    uni.showModal({
      title: '拒绝订单',
      content: '确定要拒绝这个订单吗？',
      editable: true,
      placeholderText: '请输入拒绝原因（可选）',
      success: async (res) => {
        if (!res.confirm) return

        try {
          await rejectOrder(order.id, res.content || undefined)
          uni.showToast({ title: '已拒绝订单', icon: 'success' })
          await onRefresh()
        } catch (error: any) {
          uni.showToast({ title: error?.message || '操作失败', icon: 'none' })
        }
      }
    })
  }

  const loadMore = () => {
    if (!hasMore.value || loading.value) return

    page.value++
    loadOrders()
  }

  const onRefresh = async () => {
    refreshing.value = true
    page.value = 1
    hasMore.value = true

    await loadOrderStats()
    await loadOrders()

    refreshing.value = false
  }

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

.order-status.confirmed {
  color: #1890ff;
}

.order-status.using {
  color: #722ed1;
}

.order-status.returned {
  color: #13c2c2;
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
