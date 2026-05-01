<template>
  <view class="page">
    <view v-if="disputes.length === 0" class="empty-card"><text>暂无纠纷记录</text></view>
    <view v-for="dispute in disputes" :key="dispute.id" class="card" @click="goDetail(dispute.id)">
      <text class="title">{{ dispute.order?.item?.title || `订单 #${dispute.orderId}` }}</text>
      <text class="meta">状态：{{ statusText(dispute.status) }}</text>
      <text class="desc">{{ dispute.initiatorStatement }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getMyDisputes, type Dispute } from '@/api/disputes'

const disputes = ref<Dispute[]>([])

onMounted(async () => {
  const res = await getMyDisputes()
  disputes.value = res.disputes || []
})

const goDetail = (id: number) => uni.navigateTo({ url: `/pages/dispute/detail?id=${id}` })

const statusText = (status: string) => ({ open: '待处理', awaiting_counterparty: '待对方回应', under_review: '待管理员处理', resolved: '已处理', cancelled: '已取消' }[status] || status)
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card,.empty-card { background:#fff; border-radius:18rpx; padding:24rpx; margin-bottom:20rpx; }
.title { display:block; font-size:30rpx; font-weight:600; color:#111827; }
.meta { display:block; margin-top:12rpx; font-size:24rpx; color:#007aff; }
.desc { display:block; margin-top:12rpx; font-size:24rpx; color:#6b7280; line-height:1.6; }
</style>
