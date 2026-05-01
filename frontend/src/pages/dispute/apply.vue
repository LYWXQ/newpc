<template>
  <view class="page">
    <view class="card">
      <textarea v-model="statement" class="textarea" maxlength="500" placeholder="请描述纠纷原因，并尽量补充证据说明" />
      <button class="primary-btn" :disabled="submitting" @click="submit">{{ submitting ? '提交中...' : '提交纠纷' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createOrderDispute } from '@/api/disputes'

const orderId = ref(0)
const statement = ref('')
const submitting = ref(false)

onLoad((options) => {
  orderId.value = Number(options?.orderId || 0)
})

const submit = async () => {
  if (!orderId.value) {
    uni.showToast({ title: '订单参数无效', icon: 'none' })
    return
  }
  if (!statement.value.trim()) {
    uni.showToast({ title: '请输入纠纷说明', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const res = await createOrderDispute(orderId.value, { statement: statement.value.trim(), images: [] })
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/dispute/detail?id=${res.dispute.id}` })
    }, 1200)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; }
.textarea { width:100%; min-height:280rpx; background:#f8fafc; border-radius:14rpx; padding:20rpx; box-sizing:border-box; }
.primary-btn { margin-top:24rpx; height:84rpx; line-height:84rpx; border-radius:42rpx; background:#007aff; color:#fff; font-size:28rpx; }
</style>
