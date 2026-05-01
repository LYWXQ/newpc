<template>
  <view class="page" v-if="detail">
    <view class="card">
      <text class="title">{{ detail.user.username }}</text>
      <text class="meta">信用分：{{ detail.user.creditScore }}</text>
      <text class="meta">状态：{{ detail.user.status }}</text>
      <text class="meta">违规：{{ detail.user.isViolationUser ? '是' : '否' }}</text>
    </view>
    <view class="card">
      <button class="primary-btn" @click="toggleViolation">{{ detail.user.isViolationUser ? '解除违规' : '标记违规' }}</button>
      <button v-if="canManagePassword" class="secondary-btn" @click="changePassword">修改密码</button>
      <button class="secondary-btn" @click="applyTradeRestriction">限制交易 24h</button>
      <button class="secondary-btn" @click="applyPublishRestriction">限制发布 24h</button>
      <button class="secondary-btn" @click="adjustCredit(-5)">扣 5 分</button>
      <button class="secondary-btn" @click="adjustCredit(5)">加 5 分</button>
    </view>
    <view class="card">
      <text class="section-title">近期信誉流水</text>
      <view v-for="record in detail.creditRecords" :key="record.id" class="list-item">
        <text>{{ record.reason || record.sourceType }}</text>
        <text>{{ record.delta > 0 ? '+' : '' }}{{ record.delta }}</text>
      </view>
    </view>
    <view class="card">
      <text class="section-title">近期限制记录</text>
      <view v-for="restriction in detail.restrictions" :key="restriction.id" class="list-item">
        <text>{{ restriction.restrictionType }} / {{ restriction.reason || restriction.sourceType }}</text>
        <text>{{ restriction.isActive ? '生效中' : '已结束' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { adjustAdminUserCredit, createAdminUserRestriction, getAdminUserDetail, updateAdminUserPassword, updateAdminUserViolation, type AdminUserDetailResponse } from '@/api/admin'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const userId = ref(0)
const detail = ref<AdminUserDetailResponse | null>(null)

const canManagePassword = computed(() => {
  const target = detail.value?.user
  if (!target) return false
  if (authStore.role === 'admin') {
    return target.role === 'user' && target.id !== authStore.userInfo.id
  }
  if (authStore.role === 'super_admin') {
    return target.role === 'user' || target.role === 'admin' || (target.role === 'super_admin' && target.id === authStore.userInfo.id)
  }
  return false
})

const loadDetail = async () => {
  detail.value = await getAdminUserDetail(userId.value)
}

onLoad(async (options) => {
  userId.value = Number(options?.id || 0)
  if (userId.value) await loadDetail()
})

const toggleViolation = async () => {
  if (!detail.value) return
  await updateAdminUserViolation(userId.value, {
    isViolationUser: !detail.value.user.isViolationUser,
    reason: detail.value.user.isViolationUser ? '后台解除违规' : '后台标记违规'
  })
  await loadDetail()
}

const applyTradeRestriction = async () => {
  await createAdminUserRestriction(userId.value, { restrictionType: 'trade', hours: 24, reason: '后台限制交易 24 小时' })
  await loadDetail()
}

const applyPublishRestriction = async () => {
  await createAdminUserRestriction(userId.value, { restrictionType: 'publish', hours: 24, reason: '后台限制发布 24 小时' })
  await loadDetail()
}

const adjustCredit = async (delta: number) => {
  await adjustAdminUserCredit(userId.value, { delta, reason: `后台${delta > 0 ? '加分' : '扣分'} ${Math.abs(delta)}` })
  await loadDetail()
}

const changePassword = async () => {
  if (!detail.value) return

  uni.showModal({
    title: '修改密码',
    editable: true,
    placeholderText: detail.value.user.id === authStore.userInfo.id ? '请输入新密码（将继续要求旧密码）' : '请输入新密码',
    success: async (res) => {
      const newPassword = String(res.content || '').trim()
      if (!res.confirm || !newPassword) return

      if (detail.value?.user.id === authStore.userInfo.id && authStore.role === 'super_admin') {
        uni.showModal({
          title: '验证旧密码',
          editable: true,
          placeholderText: '请输入旧密码',
          success: async (oldRes) => {
            const oldPassword = String(oldRes.content || '').trim()
            if (!oldRes.confirm || !oldPassword) return
            await updateAdminUserPassword(userId.value, { newPassword, oldPassword })
            uni.showToast({ title: '密码修改成功', icon: 'success' })
          }
        })
        return
      }

      await updateAdminUserPassword(userId.value, { newPassword })
      uni.showToast({ title: '密码修改成功', icon: 'success' })
    }
  })
}
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; margin-bottom:20rpx; }
.title { display:block; font-size:32rpx; font-weight:700; color:#111827; }
.meta { display:block; margin-top:12rpx; font-size:24rpx; color:#6b7280; }
.section-title { display:block; margin-bottom:16rpx; font-size:28rpx; font-weight:600; color:#374151; }
.list-item { display:flex; justify-content:space-between; align-items:center; padding:16rpx 0; border-bottom:1rpx solid #f1f5f9; font-size:24rpx; color:#475569; }
.primary-btn,.secondary-btn { width:100%; height:80rpx; line-height:80rpx; border-radius:40rpx; margin-bottom:16rpx; font-size:28rpx; }
.primary-btn { background:#ff4d4f; color:#fff; }
.secondary-btn { background:#007aff; color:#fff; }
</style>
