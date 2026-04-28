<template>
  <view class="my-items-container">
    <!-- 批量操作工具栏 -->
    <view class="batch-toolbar" v-if="isBatchMode">
      <view class="batch-info">
        <text class="batch-text">已选择 {{ selectedItems.length }} 项</text>
      </view>
      <view class="batch-actions">
        <text class="batch-btn cancel" @click="exitBatchMode">取消</text>
        <text class="batch-btn select-all" @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</text>
      </view>
    </view>
    
    <!-- 普通工具栏 -->
    <view class="normal-toolbar" v-else>
      <view class="toolbar-title">我的发布</view>
      <view class="toolbar-action">
        <text class="batch-mode-btn" @click="enterBatchMode">批量管理</text>
      </view>
    </view>

    <view class="filter-tabs">
      <view 
        class="tab-item" 
        :class="{ active: currentStatus === '' }"
        @click="selectStatus('')"
      >
        全部
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentStatus === 'available' }"
        @click="selectStatus('available')"
      >
        可租
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentStatus === 'rented' }"
        @click="selectStatus('rented')"
      >
        已租
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentStatus === 'offline' }"
        @click="selectStatus('offline')"
      >
        已下架
      </view>
    </view>

    <scroll-view 
      class="items-scroll" 
      scroll-y 
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="items-list">
        <view 
          class="item-card" 
          :class="{ 'batch-mode': isBatchMode, selected: isSelected(item.id) }"
          v-for="item in items" 
          :key="item.id"
          @click="isBatchMode ? toggleSelect(item) : goToDetail(item.id)"
        >
          <!-- 复选框 -->
          <view class="checkbox-wrapper" v-if="isBatchMode" @click.stop="toggleSelect(item)">
            <view class="checkbox" :class="{ checked: isSelected(item.id) }">
              <text v-if="isSelected(item.id)" class="check-icon">✓</text>
            </view>
          </view>
          
          <image class="item-image" :src="getImageUrl(item.images?.[0])" mode="aspectFill" @click.stop="isBatchMode ? toggleSelect(item) : goToDetail(item.id)" />
          <view class="item-content">
            <view class="item-header">
              <text class="item-title" @click.stop="isBatchMode ? toggleSelect(item) : goToDetail(item.id)">{{ item.title }}</text>
              <view class="item-status" :class="item.status">
                {{ getStatusText(item) }}
              </view>
            </view>
            <text class="item-desc" @click.stop="isBatchMode ? toggleSelect(item) : goToDetail(item.id)">{{ item.description || '暂无描述' }}</text>
            <view class="item-meta">
              <text class="item-price">¥{{ item.price }}/天</text>
              <text class="item-time">{{ formatDate(item.createdAt) }}</text>
            </view>
            <!-- 批量模式下的查看详情按钮 -->
            <view class="item-actions" v-if="isBatchMode">
              <view class="action-btn view-btn" @click.stop="goToDetail(item.id)">
                <text>查看详情</text>
              </view>
            </view>
            <!-- 非批量模式下的操作按钮 -->
            <view class="item-actions" v-if="!isBatchMode">
              <!-- 可租状态：编辑 + 下架 -->
              <template v-if="item.status === 'available'">
                <view class="action-btn edit-btn" @click.stop="editItem(item)">
                  <text>编辑</text>
                </view>
                <view class="action-btn offline-btn" @click.stop="offlineItemHandler(item)">
                  <text>下架</text>
                </view>
              </template>
              <!-- 已租状态：无操作按钮（自动下架） -->
              <template v-else-if="item.status === 'rented'">
                <view class="action-btn disabled-btn">
                  <text>已租出</text>
                </view>
              </template>
              <!-- 已下架状态：上架 + 编辑 + 删除 -->
              <template v-else-if="item.status === 'offline'">
                <view class="action-btn online-btn" @click.stop="onlineItemHandler(item)">
                  <text>上架</text>
                </view>
                <view class="action-btn edit-btn" @click.stop="editItem(item)">
                  <text>编辑</text>
                </view>
                <view class="action-btn delete-btn" @click.stop="deleteItemHandler(item)">
                  <text>删除</text>
                </view>
              </template>
            </view>
          </view>
        </view>
      </view>

      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && items.length > 0">
        <text>没有更多了</text>
      </view>
      <view class="empty" v-if="items.length === 0 && !loading">
        <image class="empty-icon" src="/static/logo.png" />
        <text class="empty-text">暂无物品</text>
      </view>
    </scroll-view>
    
    <!-- 批量操作底部栏 -->
    <view class="batch-bottom-bar" v-if="isBatchMode && selectedItems.length > 0">
      <view class="batch-bottom-actions">
        <view class="bottom-action-btn" @click="batchOnline" v-if="canBatchOnline">
          <text class="btn-icon">↑</text>
          <text class="btn-text">批量上架</text>
        </view>
        <view class="bottom-action-btn" @click="batchOffline" v-if="canBatchOffline">
          <text class="btn-icon">↓</text>
          <text class="btn-text">批量下架</text>
        </view>
        <view class="bottom-action-btn delete" @click="batchDelete">
          <text class="btn-icon">×</text>
          <text class="btn-text">批量删除</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getMyItems, deleteItem, updateItem, type Item } from '@/api/items'
import { formatItemStatus } from '@/utils/constants'

const currentStatus = ref('')
const items = ref<Item[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const page = ref(1)
const limit = ref(10)

// 批量操作相关
const isBatchMode = ref(false)
const selectedItems = ref<number[]>([])

// 计算是否全选
const isAllSelected = computed(() => {
  return items.value.length > 0 && selectedItems.value.length === items.value.length
})

// 计算是否可以批量上架（选中的都是已下架状态）
const canBatchOnline = computed(() => {
  const selected = items.value.filter(item => selectedItems.value.includes(item.id))
  return selected.length > 0 && selected.every(item => item.status === 'offline')
})

// 计算是否可以批量下架（选中的都是可租状态）
const canBatchOffline = computed(() => {
  const selected = items.value.filter(item => selectedItems.value.includes(item.id))
  return selected.length > 0 && selected.every(item => item.status === 'available')
})

const getImageUrl = (url?: string) => {
  if (!url) return '/static/logo.png'
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

// 获取状态文本，已下架物品显示更详细的状态
const getStatusText = (item: Item) => {
  if (item.status === 'offline') {
    if ((item as any).rentInfo || (item as any).isRented) {
      return '已租下架'
    }
    return '未上架'
  }
  
  const statusMap: Record<string, string> = {
    available: '可租',
    rented: '已租',
    offline: '已下架'
  }
  return statusMap[item.status] || formatItemStatus(item.status)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const loadItems = async (isRefresh = false) => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      status: currentStatus.value || undefined
    }
    
    const res = await getMyItems(params, { showLoading: false })
    const resItems = res.items || []
    
    if (isRefresh) {
      items.value = resItems
      // 清空选择
      selectedItems.value = []
    } else {
      items.value = [...items.value, ...resItems]
    }
    
    hasMore.value = resItems.length === limit.value && page.value < res.pagination.totalPages
  } catch (error) {
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const selectStatus = (status: string) => {
  currentStatus.value = status
  page.value = 1
  items.value = []
  hasMore.value = true
  // 退出批量模式
  exitBatchMode()
  loadItems(true)
}

const loadMore = () => {
  if (!hasMore.value || loading.value) return
  
  page.value++
  loadItems()
}

const onRefresh = () => {
  refreshing.value = true
  page.value = 1
  hasMore.value = true
  selectedItems.value = []
  loadItems(true)
}

const goToDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/item-detail/item-detail?id=${id}`
  })
}

const editItem = (item: Item) => {
  uni.navigateTo({
    url: `/pages/publish/publish?id=${item.id}`
  })
}

// 批量操作相关方法
const enterBatchMode = () => {
  isBatchMode.value = true
  selectedItems.value = []
}

const exitBatchMode = () => {
  isBatchMode.value = false
  selectedItems.value = []
}

const isSelected = (id: number) => {
  return selectedItems.value.includes(id)
}

const toggleSelect = (item: Item) => {
  const index = selectedItems.value.indexOf(item.id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item.id)
  }
}

const handleItemClick = (item: Item) => {
  if (isBatchMode.value) {
    toggleSelect(item)
  } else {
    goToDetail(item.id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = items.value.map(item => item.id)
  }
}

// 批量上架
const batchOnline = () => {
  if (selectedItems.value.length === 0) return
  
  uni.showModal({
    title: '确认批量上架',
    content: `确定要将选中的 ${selectedItems.value.length} 个物品上架吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          // 逐个更新
          for (const id of selectedItems.value) {
            await updateItem(id, { status: 'available' })
          }
          uni.showToast({ title: '批量上架成功', icon: 'success' })
          exitBatchMode()
          onRefresh()
        } catch (error) {
          uni.showToast({ title: '批量上架失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 批量下架
const batchOffline = () => {
  if (selectedItems.value.length === 0) return
  
  uni.showModal({
    title: '确认批量下架',
    content: `确定要将选中的 ${selectedItems.value.length} 个物品下架吗？`,
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          for (const id of selectedItems.value) {
            await updateItem(id, { status: 'offline' })
          }
          uni.showToast({ title: '批量下架成功', icon: 'success' })
          exitBatchMode()
          onRefresh()
        } catch (error) {
          uni.showToast({ title: '批量下架失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 批量删除
const batchDelete = () => {
  if (selectedItems.value.length === 0) return
  
  uni.showModal({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedItems.value.length} 个物品吗？删除后无法恢复！`,
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          for (const id of selectedItems.value) {
            await deleteItem(id)
          }
          uni.showToast({ title: '批量删除成功', icon: 'success' })
          exitBatchMode()
          onRefresh()
        } catch (error) {
          uni.showToast({ title: '批量删除失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 单个操作（保持原有功能）
const offlineItemHandler = (item: Item) => {
  uni.showModal({
    title: '确认下架',
    content: '下架后该物品将不再展示给其他用户，确定要下架吗？',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '下架中...' })
          await updateItem(item.id, { status: 'offline' })
          uni.showToast({ title: '下架成功', icon: 'success' })
          onRefresh()
        } catch (error) {
          uni.showToast({ title: '下架失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

const onlineItemHandler = (item: Item) => {
  uni.showModal({
    title: '确认上架',
    content: '上架后该物品将展示给其他用户，确定要上架吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '上架中...' })
          await updateItem(item.id, { status: 'available' })
          uni.showToast({ title: '上架成功', icon: 'success' })
          onRefresh()
        } catch (error) {
          uni.showToast({ title: '上架失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

const deleteItemHandler = (item: Item) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这个物品吗？',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          await deleteItem(item.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          onRefresh()
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

onMounted(() => {
  loadItems()
})
</script>

<style lang="scss">
.my-items-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

// 工具栏样式
.normal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.toolbar-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.toolbar-action {
  display: flex;
  align-items: center;
}

.batch-mode-btn {
  font-size: 28rpx;
  color: #007aff;
  padding: 8rpx 16rpx;
  border: 1rpx solid #007aff;
  border-radius: 8rpx;
}

// 批量操作工具栏
.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.batch-info {
  display: flex;
  align-items: center;
}

.batch-text {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.batch-actions {
  display: flex;
  gap: 20rpx;
}

.batch-btn {
  font-size: 28rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.batch-btn.cancel {
  color: #666;
  background-color: #f5f5f5;
}

.batch-btn.select-all {
  color: #007aff;
  background-color: #e6f7ff;
}

.filter-tabs {
  display: flex;
  background-color: #fff;
  padding: 20rpx;
  gap: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
  border-radius: 8rpx;
  background-color: #f5f5f5;
}

.tab-item.active {
  background-color: #007aff;
  color: #fff;
}

.items-scroll {
  flex: 1;
  padding: 20rpx;
  margin: 0 auto;
  max-width: 700rpx;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.item-card {
  display: flex;
  flex-direction: row;
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
  position: relative;
  max-width: 100%;
}

.item-card.batch-mode {
  padding-left: 80rpx;
  position: relative;
}

.item-card.selected {
  background-color: #e6f7ff;
  border: 2rpx solid #007aff;
}

// 复选框样式
.checkbox-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.checkbox.checked {
  background-color: #007aff;
  border-color: #007aff;
}

.check-icon {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

.item-image {
  width: 150rpx;
  height: 150rpx;
  flex-shrink: 0;
  object-fit: cover;
}

.item-content {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.item-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  margin-right: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.item-status.available {
  background-color: #e6f7ff;
  color: #1890ff;
}

.item-status.rented {
  background-color: #fff7e6;
  color: #fa8c16;
}

.item-status.offline {
  background-color: #f5f5f5;
  color: #999;
}

.item-status.reviewing {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.item-desc {
  font-size: 24rpx;
  color: #999;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.item-time {
  font-size: 22rpx;
  color: #ccc;
}

.item-actions {
  display: flex;
  gap: 8rpx;
  margin-top: 16rpx;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.item-actions.three-actions {
  gap: 8rpx;
}

.item-actions.three-actions .action-btn {
  flex: 1;
  min-width: 80rpx;
  padding: 10rpx 12rpx;
  font-size: 22rpx;
  text-align: center;
}

.action-btn {
  flex: 1;
  min-width: 80rpx;
  text-align: center;
  padding: 10rpx 12rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.edit-btn {
  background-color: #e6f7ff;
  color: #1890ff;
}

.delete-btn {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.offline-btn {
  background-color: #fff7e6;
  color: #fa8c16;
}

.online-btn {
  background-color: #f6ffed;
  color: #52c41a;
}

.view-btn {
  background-color: #e6f7ff;
  color: #1890ff;
}

.disabled-btn {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

// 批量操作底部栏
.batch-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 1rpx solid #f0f0f0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  z-index: 100;
}

.batch-bottom-actions {
  display: flex;
  justify-content: space-around;
  gap: 30rpx;
}

.bottom-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 40rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
}

.bottom-action-btn.delete {
  background-color: #fff1f0;
}

.btn-icon {
  font-size: 36rpx;
  color: #007aff;
}

.bottom-action-btn.delete .btn-icon {
  color: #ff4d4f;
}

.btn-text {
  font-size: 24rpx;
  color: #333;
}

.bottom-action-btn.delete .btn-text {
  color: #ff4d4f;
}

.load-more,
.no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
