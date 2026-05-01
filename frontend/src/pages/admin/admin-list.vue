<template>
  <view class="page">
    <view class="toolbar">
      <button class="primary-btn" @click="goCreate">新建管理员</button>
    </view>
    <view v-if="admins.length === 0" class="empty-card"><text>暂无管理员</text></view>
    <view v-for="admin in admins" :key="admin.id" class="card">
      <view class="row-between">
        <text class="title">{{ admin.username }}</text>
        <text class="status" :class="admin.status">{{ admin.status }}</text>
      </view>
      <text class="meta">角色：{{ admin.role === 'super_admin' ? '超级管理员' : '管理员' }}</text>
      <view class="actions" v-if="admin.role === 'admin'">
        <button class="mini-btn" v-if="admin.status === 'active'" @click="changeStatus(admin.id, 'deactivate')">停用</button>
        <button class="mini-btn" v-else @click="changeStatus(admin.id, 'reactivate')">恢复</button>
        <button class="mini-btn danger" @click="removeAdmin(admin.id)">注销</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { deactivateAdmin, deleteAdmin, getAdminList, reactivateAdmin, type AdminUser } from '@/api/admin'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const admins = ref<AdminUser[]>([])

const loadAdmins = async () => {
  const res = await getAdminList()
  admins.value = res.admins || []
}

onMounted(() => {
  if (!authStore.isSuperAdmin) {
    uni.redirectTo({ url: '/pages/admin/dashboard' })
    return
  }
  void loadAdmins()
})

onShow(() => {
  if (authStore.isSuperAdmin) {
    void loadAdmins()
  }
})

const goCreate = () => uni.navigateTo({ url: '/pages/admin/admin-create' })

const changeStatus = async (id: number, action: 'deactivate' | 'reactivate') => {
  if (action === 'deactivate') {
    await deactivateAdmin(id)
  } else {
    await reactivateAdmin(id)
  }
  uni.showToast({ title: '操作成功', icon: 'success' })
  await loadAdmins()
}

const removeAdmin = async (id: number) => {
  uni.showModal({
    title: '注销管理员',
    content: '确认注销该管理员账号吗？',
    success: async (res) => {
      if (!res.confirm) return
      await deleteAdmin(id)
      uni.showToast({ title: '已注销', icon: 'success' })
      await loadAdmins()
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; padding: 24rpx; }
.toolbar,.card,.empty-card { background: #fff; border-radius: 18rpx; padding: 24rpx; margin-bottom: 20rpx; }
.row-between { display:flex; justify-content:space-between; align-items:center; }
.title { font-size: 30rpx; font-weight: 600; color:#111827; }
.meta { display:block; margin-top:12rpx; color:#6b7280; font-size:24rpx; }
.actions { display:flex; gap:16rpx; margin-top:20rpx; }
.primary-btn,.mini-btn { background:#007aff; color:#fff; border-radius:40rpx; }
.primary-btn { height:84rpx; line-height:84rpx; font-size:28rpx; }
.mini-btn { flex:1; height:72rpx; line-height:72rpx; font-size:26rpx; }
.mini-btn.danger { background:#ff4d4f; }
.status { font-size:24rpx; color:#6b7280; }
.status.active { color:#52c41a; }
.status.inactive { color:#fa8c16; }
</style>
