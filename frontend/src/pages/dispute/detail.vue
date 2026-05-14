<template>
  <view class="page" v-if="dispute">
    <view class="card">
      <text class="title">{{ dispute.order?.item?.title || `订单 #${dispute.orderId}` }}</text>
      <text class="meta">状态：{{ statusText(dispute.status) }}</text>
      <text class="section">发起说明</text>
      <text class="desc">{{ dispute.initiatorStatement }}</text>
      <view class="images-grid" v-if="initiatorImages.length">
        <image v-for="(img, index) in initiatorImages" :key="`${img}-${index}`" class="evidence-image" :src="getImageUrl(img)" mode="aspectFill" @click="previewEvidence(initiatorImages, index)" />
      </view>
      <template v-if="dispute.respondentStatement || respondentImages.length">
        <text class="section">对方回应</text>
        <text class="desc" v-if="dispute.respondentStatement">{{ dispute.respondentStatement }}</text>
        <view class="images-grid" v-if="respondentImages.length">
          <image v-for="(img, index) in respondentImages" :key="`${img}-${index}`" class="evidence-image" :src="getImageUrl(img)" mode="aspectFill" @click="previewEvidence(respondentImages, index)" />
        </view>
      </template>
      <template v-if="dispute.resolutionNote">
        <text class="section">处理结果</text>
        <text class="desc">{{ dispute.resolutionNote }}</text>
      </template>
    </view>

    <view class="card" v-if="canRespond">
      <text class="section">补充回应</text>
      <textarea v-model="responseText" class="textarea" maxlength="500" placeholder="请输入回应说明" />
      <view class="images-grid section-gap">
        <view class="image-item" v-for="(img, index) in responseImages" :key="img">
          <image :src="getImageUrl(img)" mode="aspectFill" @click="previewEvidence(responseImages, index)" />
          <view class="delete-btn" @click="removeResponseImage(index)">×</view>
        </view>
        <view class="upload-btn" v-if="responseImages.length < 6" @click="chooseResponseImage">
          <text class="upload-icon">+</text>
          <text class="upload-text">{{ responseImages.length }}/6</text>
        </view>
      </view>
      <button class="primary-btn" :disabled="submitting || uploading" @click="submitResponse">{{ submitting ? '提交中...' : uploading ? '上传中...' : '提交回应' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAdminDisputeDetail } from '@/api/admin'
import { getMyDisputes, respondDispute, type Dispute } from '@/api/disputes'
import { getCurrentUserRole } from '@/utils/auth'
import { upload } from '@/utils/request'
import { getImageUrl } from '@/utils/image'

const dispute = ref<Dispute | null>(null)
const responseText = ref('')
const responseImages = ref<string[]>([])
const uploading = ref(false)
const submitting = ref(false)
const currentUserId = Number((uni.getStorageSync('userInfo') || {}).id || 0)

const initiatorImages = computed(() => dispute.value?.initiatorImages || [])
const respondentImages = computed(() => dispute.value?.respondentImages || [])

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

const previewEvidence = (images: string[], currentIndex: number) => {
  if (!images.length) return
  uni.previewImage({
    urls: images.map(img => getImageUrl(img)),
    current: getImageUrl(images[currentIndex])
  })
}

const chooseResponseImage = async () => {
  try {
    const res = await uni.chooseImage({
      count: 6 - responseImages.value.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    uploading.value = true
    for (const tempFilePath of res.tempFilePaths) {
      try {
        const uploadRes = await upload<{ url: string }>('/upload', tempFilePath)
        responseImages.value.push(uploadRes.url)
      } catch (error) {
        console.error('上传回应证据失败:', error)
        uni.showToast({ title: '上传图片失败', icon: 'none' })
      }
    }
  } catch (error) {
    console.error('选择回应图片失败:', error)
  } finally {
    uploading.value = false
  }
}

const removeResponseImage = (index: number) => {
  responseImages.value.splice(index, 1)
}

const submitResponse = async () => {
  if (!dispute.value) return
  if (!responseText.value.trim()) {
    uni.showToast({ title: '请输入回应说明', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await respondDispute(dispute.value.id, { statement: responseText.value.trim(), images: responseImages.value })
    uni.showToast({ title: '回应已提交', icon: 'success' })
    responseText.value = ''
    responseImages.value = []
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
.images-grid { display:flex; flex-wrap:wrap; gap:20rpx; margin-top:16rpx; }
.evidence-image,.image-item { width:180rpx; height:180rpx; border-radius:14rpx; overflow:hidden; }
.evidence-image { display:block; }
.image-item { position:relative; }
.image-item image,.evidence-image { width:180rpx; height:180rpx; }
.delete-btn { position:absolute; top:8rpx; right:8rpx; width:40rpx; height:40rpx; border-radius:50%; background:rgba(0,0,0,.55); color:#fff; display:flex; align-items:center; justify-content:center; font-size:30rpx; }
.upload-btn { width:180rpx; height:180rpx; border:2rpx dashed #d1d5db; border-radius:14rpx; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f8fafc; }
.upload-icon { font-size:56rpx; color:#9ca3af; line-height:1; }
.upload-text { margin-top:8rpx; font-size:24rpx; color:#9ca3af; }
.section-gap { margin-top:20rpx; }
.primary-btn { margin-top:16rpx; height:84rpx; line-height:84rpx; border-radius:42rpx; background:#007aff; color:#fff; font-size:28rpx; }
</style>
