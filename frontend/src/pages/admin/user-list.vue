<template>
  <view class="page">
    <view class="toolbar card">
      <input v-model="keyword" class="input" placeholder="搜索用户名/学号/手机号" />
      <button class="primary-btn" @click="loadUsers">搜索</button>
    </view>
    <view v-for="user in users" :key="user.id" class="card" @click="goDetail(user.id)">
      <view class="row-between">
        <text class="title">{{ user.username }}</text>
        <text class="status" :class="user.status">{{ user.status }}</text>
      </view>
      <text class="meta">信用分：{{ user.creditScore }} · {{ user.isViolationUser ? '违规用户' : '正常用户' }}</text>
      <text class="meta">限制：{{ buildRestrictionText(user) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAdminUsers, type AdminUser } from '@/api/admin'

const users = ref<AdminUser[]>([])
const keyword = ref('')

const loadUsers = async () => {
  const res = await getAdminUsers({ keyword: keyword.value.trim() || undefined, role: 'user', page: 1, limit: 50 })
  users.value = res.users || []
}

onMounted(() => { void loadUsers() })

const buildRestrictionText = (user: AdminUser) => {
  const tags: string[] = []
  if (user.tradeRestrictedUntil) tags.push('交易受限')
  if (user.publishRestrictedUntil) tags.push('发布受限')
  return tags.length > 0 ? tags.join(' / ') : '无'
}

const goDetail = (id: number) => uni.navigateTo({ url: `/pages/admin/user-detail?id=${id}` })
</script>

<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding:24rpx; }
.card { background:#fff; border-radius:18rpx; padding:24rpx; margin-bottom:20rpx; }
.row-between { display:flex; justify-content:space-between; align-items:center; }
.input { width:100%; height:84rpx; background:#f8fafc; border-radius:14rpx; padding:0 24rpx; box-sizing:border-box; margin-bottom:16rpx; }
.primary-btn { height:80rpx; line-height:80rpx; border-radius:40rpx; background:#007aff; color:#fff; font-size:28rpx; }
.title { font-size:30rpx; font-weight:600; color:#111827; }
.meta { display:block; margin-top:10rpx; font-size:24rpx; color:#6b7280; }
.status.active { color:#52c41a; }
.status.inactive { color:#fa8c16; }
.status.banned { color:#ff4d4f; }
</style>
