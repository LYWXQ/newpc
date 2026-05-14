<template>
  <view class="page" v-if="dispute">
    <view class="card">
      <text class="title">{{ dispute.order?.item?.title || `订单 #${dispute.orderId}` }}</text>
      <text class="meta">状态：{{ statusText(dispute.status) }}</text>
      <text class="section-title">发起方说明</text>
      <text class="desc">{{ dispute.initiatorStatement }}</text>
      <view v-if="initiatorImages.length">
        <text class="section-subtitle">发起方证据</text>
        <view class="images-grid">
          <image v-for="(img, index) in initiatorImages" :key="`${img}-${index}`" class="evidence-image" :src="getImageUrl(img)" mode="aspectFill" @click="previewImages(initiatorImages, index)" />
        </view>
      </view>
      <text class="section-title" v-if="dispute.respondentStatement || respondentImages.length">对方回应</text>
      <text class="desc" v-if="dispute.respondentStatement">{{ dispute.respondentStatement }}</text>
      <template v-if="dispute.respondentStatement || respondentImages.length">
        <text class="section-subtitle">回应方证据</text>
        <view class="images-grid" v-if="respondentImages.length">
          <image v-for="(img, index) in respondentImages" :key="`${img}-${index}`" class="evidence-image" :src="getImageUrl(img)" mode="aspectFill" @click="previewImages(respondentImages, index)" />
        </view>
        <text class="empty-text" v-else>未上传证据</text>
      </template>
      <text class="empty-text" v-else>未收到对方回应</text>
    </view>

    <view class="card" v-if="dispute.status !== 'resolved'">
      <picker class="picker" :range="verdictLabels" :value="verdictIndex" @change="onVerdictChange">
        <view class="picker-text">{{ verdictLabels[verdictIndex] }}</view>
      </picker>
      <input v-model="lossAmount" class="input" type="number" placeholder="损失金额（可选）" />
      <input v-model="borrowerPenaltyScore" class="input" type="number" placeholder="借方扣分" />
      <input v-model="lenderPenaltyScore" class="input" type="number" placeholder="卖方扣分" />
      <textarea v-model="resolutionNote" class="textarea" maxlength="500" placeholder="请输入处理说明" />
      <button class="primary-btn" :disabled="submitting" @click="submit">{{ submitting ? '处理中...' : '提交处理结果' }}</button>
    </view>

    <view class="card" v-else>
      <text class="section-title">裁决结果</text>
      <text class="desc">{{ dispute.resolutionNote || '无' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAdminDisputeDetail, resolveAdminDispute } from '@/api/admin'
import { getImageUrl } from '@/utils/image'
import type { Dispute, DisputeVerdict } from '@/api/disputes'

const dispute = ref<Dispute | null>(null)
const resolutionNote = ref('')
const lossAmount = ref('')
const borrowerPenaltyScore = ref('0')
const lenderPenaltyScore = ref('0')
const submitting = ref(false)
const verdictValues: DisputeVerdict[] = ['borrower_responsible', 'lender_responsible', 'shared_responsibility', 'no_fault']
const verdictLabels = ['借方负责', '卖方负责', '双方有责', '双方无责']
const verdictIndex = ref(0)
const initiatorImages = computed(() => dispute.value?.initiatorImages || [])
const respondentImages = computed(() => dispute.value?.respondentImages || [])

const loadDetail = async (id: number) => {
  dispute.value = (await getAdminDisputeDetail(id)).dispute
  resolutionNote.value = dispute.value?.resolutionNote || ''
}

onLoad(async (options) => {
  const id = Number(options?.id || 0)
  if (!id) return
  await loadDetail(id)
})

const onVerdictChange = (event: any) => {
  verdictIndex.value = Number(event.detail.value || 0)
}

const previewImages = (images: string[], currentIndex: number) => {
  if (!images.length) return
  uni.previewImage({
    urls: images.map(img => getImageUrl(img)),
    current: getImageUrl(images[currentIndex])
  })
}

const submit = async () => {
  if (!dispute.value) return
  if (!resolutionNote.value.trim()) {
    uni.showToast({ title: '请输入处理说明', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await resolveAdminDispute(dispute.value.id, {
      verdict: verdictValues[verdictIndex.value],
      lossAmount: lossAmount.value ? Number(lossAmount.value) : 0,
      resolutionNote: resolutionNote.value.trim(),
      borrowerPenaltyScore: Number(borrowerPenaltyScore.value || 0),
      lenderPenaltyScore: Number(lenderPenaltyScore.value || 0),
      restrictionHours: 24
    })
    uni.showToast({ title: '处理成功', icon: 'success' })
    await loadDetail(dispute.value.id)
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
.meta,.section-title,.section-subtitle,.desc,.empty-text { display:block; }
.meta { margin-top:12rpx; font-size:24rpx; color:#007aff; }
.section-title { margin-top:20rpx; font-size:26rpx; font-weight:600; color:#374151; }
.section-subtitle { margin-top:16rpx; font-size:24rpx; color:#4b5563; }
.desc { margin-top:12rpx; font-size:24rpx; color:#6b7280; line-height:1.7; }
.empty-text { margin-top:12rpx; font-size:24rpx; color:#9ca3af; }
.images-grid { display:flex; flex-wrap:wrap; gap:20rpx; margin-top:16rpx; }
.evidence-image { width:180rpx; height:180rpx; border-radius:14rpx; display:block; }
.input,.picker,.textarea { width:100%; box-sizing:border-box; background:#f8fafc; border-radius:14rpx; padding:18rpx 22rpx; margin-bottom:16rpx; }
.textarea { min-height:220rpx; }
.picker-text { font-size:26rpx; color:#111827; }
.primary-btn { height:84rpx; line-height:84rpx; border-radius:42rpx; background:#007aff; color:#fff; font-size:28rpx; }
</style>
