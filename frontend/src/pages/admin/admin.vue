<template>
  <view class="admin-container">
    <view class="admin-header">
      <view class="user-info">
        <image class="avatar" :src="userInfo?.avatar || '/static/logo.png'" mode="aspectFill" />
        <view class="info">
          <text class="nickname">{{ userInfo?.username }}</text>
          <text class="role">{{ roleText }}</text>
        </view>
      </view>
      <button class="logout-btn" @click="handleLogout">退出</button>
    </view>

    <scroll-view class="admin-content" scroll-y>
      <view class="dashboard-section" v-if="currentTab === 'dashboard'">
        <view class="section-title">数据概览</view>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-number">{{ stats.userCount || 0 }}</text>
            <text class="stat-label">用户总数</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ stats.itemCount || 0 }}</text>
            <text class="stat-label">物品总数</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ stats.orderCount || 0 }}</text>
            <text class="stat-label">订单总数</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ stats.reviewCount || 0 }}</text>
            <text class="stat-label">评价总数</text>
          </view>
        </view>

        <view class="section-title">最近订单</view>
        <view class="order-list" v-if="recentOrders.length > 0">
          <view class="order-item" v-for="order in recentOrders" :key="order.id">
            <image class="item-img" :src="getImageUrl(order.item?.images?.[0])" mode="aspectFill" />
            <view class="order-info">
              <text class="item-title">{{ order.item?.title || '未知物品' }}</text>
              <text class="order-detail">
                {{ order.lender?.username || '出借方' }} → {{ order.borrower?.username || '借用方' }}
              </text>
              <view class="order-meta">
                <text class="order-status" :class="order.status">{{ statusText[order.status] }}</text>
                <text class="order-time">{{ formatTime(order.createdAt) }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="empty-state" v-else>
          <text>暂无订单</text>
        </view>
      </view>

      <view class="users-section" v-if="currentTab === 'users'">
        <view class="section-header">
          <text class="section-title">用户管理</text>
        </view>
        <view class="filter-bar">
          <input 
            class="search-input" 
            v-model="userSearch" 
            placeholder="搜索用户" 
            @confirm="loadUsers"
          />
        </view>
        <view class="user-list" v-if="users.length > 0">
          <view class="user-item" v-for="user in users" :key="user.id">
            <image class="user-avatar" :src="user.avatar || '/static/logo.png'" mode="aspectFill" />
            <view class="user-detail">
              <text class="user-name">{{ user.username }}</text>
              <text class="user-account">
                {{ user.username }}
                <text v-if="user.studentId"> | {{ user.studentId }}</text>
              </text>
              <view class="user-meta">
                <text class="user-role" :class="user.role">{{ user.role === 'root' ? '超级用户' : user.role === 'admin' ? '管理员' : '普通用户' }}</text>
                <text class="user-credit">信用: {{ user.creditScore }}</text>
              </view>
            </view>
            <view class="user-actions" v-if="user.role !== 'root'">
              <picker 
                :range="statusOptions" 
                :value="statusIndex(user.status)" 
                @change="(e: any) => changeUserStatus(user.id, e)"
              >
                <view class="status-picker">{{ statusText[user.status] || user.status }}</view>
              </picker>
            </view>
          </view>
        </view>
        <view class="empty-state" v-else>
          <text>暂无用户</text>
        </view>
      </view>

      <view class="admins-section" v-if="currentTab === 'admins' && userInfo?.role === 'root'">
        <view class="section-header">
          <text class="section-title">管理员管理</text>
          <button class="add-btn" @click="showCreateModal = true">添加管理员</button>
        </view>
        <view class="admin-list" v-if="admins.length > 0">
          <view class="admin-item" v-for="admin in admins" :key="admin.id">
            <view class="admin-info">
              <text class="admin-name">{{ admin.username }}</text>
              <text class="admin-username">{{ admin.username }}</text>
              <view class="admin-meta">
                <text class="admin-role" :class="admin.role">{{ admin.role === 'root' ? '超级用户' : '管理员' }}</text>
                <text class="admin-status" :class="admin.status">{{ statusText[admin.status] }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="empty-state" v-else>
          <text>暂无管理员</text>
        </view>
      </view>

      <view class="items-section" v-if="currentTab === 'items'">
        <view class="section-header">
          <text class="section-title">物品管理</text>
        </view>
        <view class="filter-bar">
          <input 
            class="search-input" 
            v-model="itemSearch" 
            placeholder="搜索物品" 
            @confirm="loadItems"
          />
        </view>
        <view class="item-list" v-if="items.length > 0">
          <view class="item-row" v-for="item in items" :key="item.id">
            <image class="item-thumb" :src="getImageUrl(item.images?.[0])" mode="aspectFill" />
            <view class="item-detail">
              <text class="item-title">{{ item.title }}</text>
              <text class="item-price">¥{{ item.price }}/天 | 押金: ¥{{ item.deposit }}</text>
              <view class="item-meta">
                <text class="item-status" :class="item.status">{{ itemStatusText[item.status] }}</text>
                <text class="item-user">{{ item.user?.username || '发布者' }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="empty-state" v-else>
          <text>暂无物品</text>
        </view>
      </view>

      <view class="orders-section" v-if="currentTab === 'orders'">
        <view class="section-header">
          <text class="section-title">订单管理</text>
        </view>
        <view class="filter-bar">
          <picker :range="orderStatusOptions" :value="orderStatusIndex" @change="changeOrderStatusFilter">
            <view class="filter-picker">{{ orderStatusOptions[orderStatusIndex] }}</view>
          </picker>
        </view>
        <view class="order-list" v-if="orders.length > 0">
          <view class="order-item" v-for="order in orders" :key="order.id">
            <image class="item-img" :src="getImageUrl(order.item?.images?.[0])" mode="aspectFill" />
            <view class="order-info">
              <text class="item-title">{{ order.item?.title || '未知物品' }}</text>
              <text class="order-detail">
                出借: {{ order.lender?.username || '未知' }} | 借用: {{ order.borrower?.username || '未知' }}
              </text>
              <view class="order-meta">
                <text class="order-status" :class="order.status">{{ statusText[order.status] }}</text>
                <text class="order-time">{{ formatTime(order.createdAt) }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="empty-state" v-else>
          <text>暂无订单</text>
        </view>
      </view>
    </scroll-view>

    <view class="admin-tabs">
      <view 
        class="admin-tab" 
        :class="{ active: currentTab === 'dashboard' }"
        @click="switchTab('dashboard')"
      >
        <text>概览</text>
      </view>
      <view 
        class="admin-tab" 
        :class="{ active: currentTab === 'users' }"
        @click="switchTab('users')"
      >
        <text>用户</text>
      </view>
      <view 
        class="admin-tab" 
        v-if="userInfo?.role === 'root'"
        :class="{ active: currentTab === 'admins' }"
        @click="switchTab('admins')"
      >
        <text>管理员</text>
      </view>
      <view 
        class="admin-tab" 
        :class="{ active: currentTab === 'items' }"
        @click="switchTab('items')"
      >
        <text>物品</text>
      </view>
      <view 
        class="admin-tab" 
        :class="{ active: currentTab === 'orders' }"
        @click="switchTab('orders')"
      >
        <text>订单</text>
      </view>
    </view>

    <view class="modal-mask" v-if="showCreateModal" @click="showCreateModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加管理员</text>
          <text class="close-btn" @click="showCreateModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">用户名</text>
            <input class="input" v-model="newAdmin.username" placeholder="请输入用户名" />
          </view>
          <view class="form-item">
            <text class="label">密码</text>
            <input class="input" type="password" v-model="newAdmin.password" placeholder="请输入密码" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="showCreateModal = false">取消</button>
          <button class="confirm-btn" @click="createAdmin" :disabled="creating">
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request, get, post, put } from '@/utils/request'

const currentTab = ref('dashboard')
const showCreateModal = ref(false)
const creating = ref(false)

const userInfo = ref<any>(null)
const stats = ref<any>({})
const recentOrders = ref<any[]>([])
const users = ref<any[]>([])
const admins = ref<any[]>([])
const items = ref<any[]>([])
const orders = ref<any[]>([])
const userSearch = ref('')
const itemSearch = ref('')
const orderStatusFilter = ref('')

const newAdmin = ref({
  username: '',
  password: ''
})

const statusOptions = ['active', 'inactive', 'banned']
const orderStatusOptions = ['全部', 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled']
const orderStatusIndex = ref(0)

const statusText: Record<string, string> = {
  active: '正常',
  inactive: '停用',
  banned: '禁用',
  pending: '待处理',
  approved: '已同意',
  rejected: '已拒绝',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const itemStatusText: Record<string, string> = {
  available: '可租',
  rented: '已租',
  offline: '下架'
}

const roleText = computed(() => {
  if (!userInfo.value) return ''
  return userInfo.value.role === 'root' ? '超级用户' : userInfo.value.role === 'admin' ? '管理员' : '用户'
})

const getImageUrl = (url?: string) => {
  if (!url) return '/static/logo.png'
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const statusIndex = (status: string) => {
  return statusOptions.indexOf(status)
}

const loadDashboard = async () => {
  try {
    const res = await get('/admin/dashboard')
    stats.value = res.stats || {}
    recentOrders.value = res.recentOrders || []
  } catch (error) {
    console.error('加载仪表板失败:', error)
  }
}

const loadUsers = async () => {
  try {
    const res = await get('/admin/users', { keyword: userSearch.value || undefined })
    users.value = res.users || []
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

const loadAdmins = async () => {
  try {
    const res = await get('/admin/admins')
    admins.value = res.admins || []
  } catch (error) {
    console.error('加载管理员列表失败:', error)
  }
}

const loadItems = async () => {
  try {
    const res = await get('/admin/items', { keyword: itemSearch.value || undefined })
    items.value = res.items || []
  } catch (error) {
    console.error('加载物品列表失败:', error)
  }
}

const loadOrders = async () => {
  try {
    const status = orderStatusIndex.value > 0 ? orderStatusOptions[orderStatusIndex.value] : undefined
    const res = await get('/admin/orders', { status })
    orders.value = res.orders || []
  } catch (error) {
    console.error('加载订单列表失败:', error)
  }
}

const switchTab = (tab: string) => {
  currentTab.value = tab
  if (tab === 'dashboard') loadDashboard()
  else if (tab === 'users') loadUsers()
  else if (tab === 'admins') loadAdmins()
  else if (tab === 'items') loadItems()
  else if (tab === 'orders') loadOrders()
}

const changeUserStatus = async (userId: number, e: any) => {
  const newStatus = statusOptions[e.detail.value]
  try {
    await put(`/admin/users/${userId}/status`, { status: newStatus })
    uni.showToast({ title: '状态更新成功', icon: 'success' })
    loadUsers()
  } catch (error) {
    console.error('更新用户状态失败:', error)
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const changeOrderStatusFilter = (e: any) => {
  orderStatusIndex.value = e.detail.value
  loadOrders()
}

const createAdmin = async () => {
  if (!newAdmin.value.username || !newAdmin.value.password) {
    uni.showToast({ title: '用户名和密码不能为空', icon: 'none' })
    return
  }

  creating.value = true
  try {
    await post('/admin/users', newAdmin.value)
    uni.showToast({ title: '创建成功', icon: 'success' })
    showCreateModal.value = false
    newAdmin.value = { username: '', password: '' }
    loadAdmins()
  } catch (error: any) {
    console.error('创建管理员失败:', error)
    uni.showToast({ title: error.message || '创建失败', icon: 'none' })
  } finally {
    creating.value = false
  }
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        uni.redirectTo({ url: '/pages/login/login' })
      }
    }
  })
}

onLoad(() => {
  const savedUser = uni.getStorageSync('userInfo')
  if (savedUser) {
    userInfo.value = savedUser
  }
})

onMounted(() => {
  loadDashboard()
})
</script>

<style lang="scss">
.admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background-color: #f0f0f0;
}

.info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.role {
  font-size: 24rpx;
  color: #667eea;
}

.logout-btn {
  padding: 16rpx 32rpx;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 26rpx;
  border-radius: 8rpx;
}

.logout-btn::after {
  border: none;
}

.admin-content {
  flex: 1;
  padding: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.add-btn {
  padding: 12rpx 24rpx;
  background-color: #667eea;
  color: #fff;
  font-size: 26rpx;
  border-radius: 8rpx;
}

.add-btn::after {
  border: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.filter-bar {
  margin-bottom: 20rpx;
}

.search-input,
.filter-picker {
  width: 100%;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.order-list,
.user-list,
.admin-list,
.item-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order-item,
.user-item,
.admin-item,
.item-row {
  display: flex;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
}

.item-img,
.item-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
  background-color: #f0f0f0;
}

.order-info,
.user-detail,
.admin-info,
.item-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.order-detail,
.user-account,
.item-price,
.admin-username {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.order-meta,
.user-meta,
.admin-meta,
.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-status,
.user-role,
.admin-role,
.item-status,
.user-credit,
.admin-status,
.item-user,
.order-time {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.order-status.pending,
.user-role.user {
  background-color: #fff7e6;
  color: #fa8c16;
}

.order-status.approved,
.order-status.in_progress,
.user-role.admin,
.admin-role.admin {
  background-color: #e6f7ff;
  color: #1890ff;
}

.order-status.completed,
.admin-role.root,
.user-role.root {
  background-color: #f6ffed;
  color: #52c41a;
}

.order-status.rejected,
.order-status.cancelled {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.order-time,
.user-credit,
.item-user {
  background: none;
  color: #999;
  padding: 0;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background-color: #f0f0f0;
}

.user-name,
.admin-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.user-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.status-picker {
  padding: 12rpx 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.empty-state {
  padding: 80rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999;
}

.admin-tabs {
  display: flex;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  padding-bottom: env(safe-area-inset-bottom);
}

.admin-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 26rpx;
  color: #666;
}

.admin-tab.active {
  color: #667eea;
  font-weight: 500;
  border-bottom: 4rpx solid #667eea;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 600rpx;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.input {
  width: 100%;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 0 30rpx 30rpx;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background-color: #667eea;
  color: #fff;
}

.cancel-btn::after,
.confirm-btn::after {
  border: none;
}
</style>
