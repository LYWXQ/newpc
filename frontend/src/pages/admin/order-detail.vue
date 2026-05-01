<template>
  <view class="page" v-if="order">
    <view class="card">
      <text class="title">{{ order.item?.title || `订单 #${order.id}` }}</text>
      <text class="meta">订单号：{{ order.orderNo || order.id }}</text>
      <text class="meta">状态：{{ order.status }}</text>
      <text class="meta">借方：{{ order.borrower?.username || '--' }}</text>
      <text class="meta">卖方：{{ order.lender?.username || '--' }}</text>
      <text class="meta">交易时间：{{ order.startDate }}</text>
      <text class="meta">归还时间：{{ order.endDate }}</text>
      <button v-if="order.dispute" class="primary-btn" @click="goDispute(order.dispute.id)">查看关联纠纷</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAdminOrderDetail } from '@/api/admin'
import type { Order } from '@/api/orders'

const order = ref<(Order & { dispute?: { id: number } | null }) | null>(null)

onLoad(async (options) => {
  const id = Number(options?.id || 0)
  if (!id) return
  order.value = (await getAdminOrderDetail(id)).order
})

const goDispute = (id: number) => uni.navigateTo({ url: `/pages/admin/dispute-detail?id=${id}` })
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; }
.title { display:block; font-size:30rpx; font-weight:600; color:#111827; }
.meta { display:block; margin-top:12rpx; font-size:24rpx; color:#6b7280; }
.primary-btn { margin-top:24rpx; height:80rpx; line-height:80rpx; border-radius:40rpx; background:#007aff; color:#fff; font-size:28rpx; }
</style>
