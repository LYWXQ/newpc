<template>
  <view class="page">
    <view class="toolbar card">
      <input v-model="keyword" class="input" placeholder="搜索物品标题" />
      <button class="primary-btn" @click="loadOrders">搜索</button>
    </view>
    <view v-for="order in orders" :key="order.id" class="card" @click="goDetail(order.id)">
      <text class="title">{{ order.item?.title || `订单 #${order.id}` }}</text>
      <text class="meta">状态：{{ order.status }} · 借方：{{ order.borrower?.username || '--' }}</text>
      <text class="meta">卖方：{{ order.lender?.username || '--' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAdminOrders } from '@/api/admin'
import type { Order } from '@/api/orders'

const orders = ref<Order[]>([])
const keyword = ref('')

const loadOrders = async () => {
  const res = await getAdminOrders({ keyword: keyword.value.trim() || undefined, page: 1, limit: 50 })
  orders.value = res.orders || []
}

onMounted(() => { void loadOrders() })

const goDetail = (id: number) => uni.navigateTo({ url: `/pages/admin/order-detail?id=${id}` })
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; margin-bottom:20rpx; }
.input { width:100%; height:84rpx; background:#f8fafc; border-radius:14rpx; padding:0 24rpx; box-sizing:border-box; margin-bottom:16rpx; }
.primary-btn { height:80rpx; line-height:80rpx; border-radius:40rpx; background:#007aff; color:#fff; font-size:28rpx; }
.title { display:block; font-size:30rpx; font-weight:600; color:#111827; }
.meta { display:block; margin-top:10rpx; font-size:24rpx; color:#6b7280; }
</style>
