<template>
  <view class="page" v-if="dispute">
    <view class="card">
      <text class="title">{{ dispute.order?.item?.title || `订单 #${dispute.orderId}` }}</text>
      <text class="meta">状态：{{ statusText(dispute.status) }}</text>
      <text class="section">发起说明</text>
      <text class="desc">{{ dispute.initiatorStatement }}</text>
      <template v-if="dispute.respondentStatement">
        <text class="section">对方回应</text>
        <text class="desc">{{ dispute.respondentStatement }}</text>
      </template>
      <template v-if="dispute.resolutionNote">
        <text class="section">处理结果</text>
        <text class="desc">{{ dispute.resolutionNote }}</text>
      </template>
    </view>

    <view class="card" v-if="canRespond">
      <text class="section">补充回应</text>
      <textarea v-model="responseText" class="textarea" maxlength="500" placeholder="请输入回应说明" />
      <button class="primary-btn" :disabled="submitting" @click="submitResponse">{{ submitting ? '提交中...' : '提交回应' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAdminDisputeDetail } from '@/api/admin'
import { getMyDisputes, respondDispute, type Dispute } from '@/api/disputes'
import { getCurrentUserRole } from '@/utils/auth'

const dispute = ref<Dispute | null>(null)
const responseText = ref('')
const submitting = ref(false)
const currentUserId = Number((uni.getStorageSync('userInfo') || {}).id || 0)

const canRespond = computed(() => {
  if (!dispute.value || !currentUserId) return false
  return dispute.value.respondentId === currentUserId && !dispute.value.respondentStatement && ['open', 'awaiting_counterparty'].includes(dispute.value.status)
})

const loadDispute = async (id: number) => {
  if (getCurrentUserRole() === 'admin' || getCurrentUserRole() === 'super_admin') {
    dispute.value = (await getAdminDisputeDetail(id)).dispute
    return
  }
  const res = await getMyDisputes()
  dispute.value = (res.disputes || []).find(item => item.id === id) || null
}

onLoad(async (options) => {
  const id = Number(options?.id || 0)
  if (!id) return
  await loadDispute(id)
})

const submitResponse = async () => {
  if (!dispute.value) return
  if (!responseText.value.trim()) {
    uni.showToast({ title: '请输入回应说明', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await respondDispute(dispute.value.id, { statement: responseText.value.trim(), images: [] })
    uni.showToast({ title: '回应已提交', icon: 'success' })
    responseText.value = ''
    await loadDispute(dispute.value.id)
  } finally {
    submitting.value = false
  }
}

const statusText = (status: string) => ({ open: '待处理', awaiting_counterparty: '待对方回应', under_review: '待管理员处理', resolved: '已处理', cancelled: '已取消' }[status] || status)
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; margin-bottom:20rpx; }
.title { display:block; font-size:30rpx; font-weight:600; color:#111827; }
.meta,.section,.desc { display:block; }
.meta { margin-top:12rpx; font-size:24rpx; color:#007aff; }
.section { margin-top:20rpx; font-size:26rpx; font-weight:600; color:#374151; }
.desc { margin-top:12rpx; font-size:24rpx; color:#6b7280; line-height:1.7; }
.textarea { width:100%; min-height:220rpx; box-sizing:border-box; background:#f8fafc; border-radius:14rpx; padding:18rpx 22rpx; margin-top:16rpx; }
.primary-btn { margin-top:16rpx; height:84rpx; line-height:84rpx; border-radius:42rpx; background:#007aff; color:#fff; font-size:28rpx; }
</style>
