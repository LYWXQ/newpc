<template>
  <view class="page">
    <view v-for="dispute in disputes" :key="dispute.id" class="card" @click="goDetail(dispute.id)">
      <text class="title">{{ dispute.order?.item?.title || `订单 #${dispute.orderId}` }}</text>
      <text class="meta">状态：{{ statusText(dispute.status) }}</text>
      <text class="meta">借方：{{ dispute.borrower?.username || '--' }} · 卖方：{{ dispute.lender?.username || '--' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAdminDisputes } from '@/api/admin'
import type { Dispute } from '@/api/disputes'

const disputes = ref<Dispute[]>([])

onMounted(async () => {
  const res = await getAdminDisputes({ page: 1, limit: 50 })
  disputes.value = res.disputes || []
})

const goDetail = (id: number) => uni.navigateTo({ url: `/pages/admin/dispute-detail?id=${id}` })
const statusText = (status: string) => ({ open: '待处理', awaiting_counterparty: '待对方回应', under_review: '待管理员处理', resolved: '已处理', cancelled: '已取消' }[status] || status)
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; margin-bottom:20rpx; }
.title { display:block; font-size:30rpx; font-weight:600; color:#111827; }
.meta { display:block; margin-top:10rpx; font-size:24rpx; color:#6b7280; }
</style>
