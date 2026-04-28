<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <text class="nav-title">我的收藏</text>
      <text class="nav-action" @click="toggleBatchMode">{{ isBatchMode ? '完成' : '批量管理' }}</text>
    </view>

    <!-- 收藏列表 -->
    <scroll-view class="favorites-list" scroll-y @scrolltolower="loadMore" v-if="favorites.length > 0">
      <view 
        class="favorite-item" 
        :class="{ 'selected': isBatchMode && selectedItems.includes(favorite.item.id) }"
        v-for="favorite in favorites" 
        :key="favorite.id"
        @click="handleItemClick(favorite.item.id)"
      >
        <!-- 批量选择复选框 -->
        <view class="checkbox" v-if="isBatchMode">
          <text class="checkbox-icon" :class="{ 'checked': selectedItems.includes(favorite.item.id) }">
            {{ selectedItems.includes(favorite.item.id) ? '✓' : '' }}
          </text>
        </view>

        <!-- 物品图片 -->
        <image 
          class="item-image" 
          :src="getImageUrl(favorite.item.images?.[0])" 
          mode="aspectFill"
        />

        <!-- 物品信息 -->
        <view class="item-info">
          <text class="item-title">{{ favorite.item.title }}</text>
          <text class="item-price">¥{{ favorite.item.price }}/天</text>
          <text class="item-owner">发布者: {{ favorite.item.user?.username }}</text>
        </view>

        <!-- 取消收藏按钮 -->
        <view 
          class="unfavorite-btn" 
          v-if="!isBatchMode"
          @click.stop="confirmUnfavorite(favorite.item.id)"
        >
          <text class="unfavorite-text">取消收藏</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="loading">
        <text class="load-text">加载中...</text>
      </view>
      <view class="no-more" v-else-if="!hasMore">
        <text class="no-more-text">没有更多了</text>
      </view>
    </scroll-view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无收藏物品</text>
      <text class="empty-subtext">快去浏览感兴趣的物品吧</text>
      <button class="browse-btn" @click="goToBrowse">去浏览</button>
    </view>

    <!-- 批量操作栏 -->
    <view class="batch-action-bar" v-if="isBatchMode && favorites.length > 0">
      <view class="select-all" @click="toggleSelectAll">
        <text class="checkbox-icon" :class="{ 'checked': isAllSelected }">
          {{ isAllSelected ? '✓' : '' }}
        </text>
        <text class="select-text">{{ isAllSelected ? '取消全选' : '全选' }}</text>
      </view>
      <button 
        class="batch-unfavorite-btn" 
        :disabled="selectedItems.length === 0"
        @click="confirmBatchUnfavorite"
      >
        取消收藏({{ selectedItems.length }})
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getFavorites, removeFavorite, batchRemoveFavorites, type Favorite } from '@/api/favorites'

// 收藏列表
const favorites = ref<Favorite[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 10
const hasMore = ref(true)

// 批量模式
const isBatchMode = ref(false)
const selectedItems = ref<number[]>([])

// 计算属性：是否全选
const isAllSelected = computed(() => {
  if (favorites.value.length === 0) return false
  return favorites.value.every(fav => selectedItems.value.includes(fav.item.id))
})

// 获取图片URL
const getImageUrl = (url: string | undefined): string => {
  if (!url) return '/static/logo.png'
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

// 加载收藏列表
const loadFavorites = async (isRefresh = false) => {
  if (loading.value) return
  
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }
  
  if (!hasMore.value && !isRefresh) return
  
  loading.value = true
  
  try {
    const res = await getFavorites(page.value, limit)
    
    if (isRefresh) {
      favorites.value = res.favorites
    } else {
      favorites.value = [...favorites.value, ...res.favorites]
    }
    
    hasMore.value = res.pagination.page < res.pagination.totalPages
    page.value++
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    uni.showToast({ title: '获取收藏列表失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadFavorites()
  }
}

// 切换批量模式
const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value
  if (!isBatchMode.value) {
    selectedItems.value = []
  }
}

// 切换选择
const toggleSelect = (itemId: number) => {
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(itemId)
  }
}

// 切换全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = favorites.value.map(fav => fav.item.id)
  }
}

// 确认取消收藏
const confirmUnfavorite = (itemId: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消收藏该物品吗？',
    success: (res) => {
      if (res.confirm) {
        unfavorite(itemId)
      }
    }
  })
}

// 取消收藏
const unfavorite = async (itemId: number) => {
  try {
    await removeFavorite(itemId)
    favorites.value = favorites.value.filter(fav => fav.item.id !== itemId)
    uni.showToast({ title: '已取消收藏', icon: 'success' })
  } catch (error) {
    console.error('取消收藏失败:', error)
    uni.showToast({ title: '取消收藏失败', icon: 'none' })
  }
}

// 确认批量取消收藏
const confirmBatchUnfavorite = () => {
  if (selectedItems.value.length === 0) {
    uni.showToast({ title: '请选择要取消收藏的物品', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '提示',
    content: `确定要取消收藏选中的 ${selectedItems.value.length} 个物品吗？`,
    success: (res) => {
      if (res.confirm) {
        batchUnfavorite()
      }
    }
  })
}

// 批量取消收藏
const batchUnfavorite = async () => {
  try {
    await batchRemoveFavorites(selectedItems.value)
    favorites.value = favorites.value.filter(fav => !selectedItems.value.includes(fav.item.id))
    selectedItems.value = []
    uni.showToast({ title: '批量取消收藏成功', icon: 'success' })
  } catch (error) {
    console.error('批量取消收藏失败:', error)
    uni.showToast({ title: '批量取消收藏失败', icon: 'none' })
  }
}

// 处理列表项点击
const handleItemClick = (itemId: number) => {
  if (isBatchMode.value) {
    toggleSelect(itemId)
  } else {
    goToItemDetail(itemId)
  }
}

// 跳转到物品详情
const goToItemDetail = (itemId: number) => {
  uni.navigateTo({ url: `/pages/item-detail/item-detail?id=${itemId}` })
}

// 去浏览
const goToBrowse = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

// 页面显示
onShow(() => {
  loadFavorites(true)
})

// 页面加载
onMounted(() => {
  loadFavorites(true)
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 32rpx 20rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.nav-action {
  font-size: 28rpx;
  color: #007aff;
}

/* 收藏列表 */
.favorites-list {
  height: calc(100vh - 200rpx);
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin: 16rpx 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
}

.favorite-item.selected {
  background-color: #e6f7ff;
  border-color: #007aff;
}

/* 复选框 */
.checkbox {
  margin-right: 20rpx;
}

.checkbox-icon {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #cccccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #ffffff;
}

.checkbox-icon.checked {
  background-color: #007aff;
  border-color: #007aff;
}

/* 物品图片 */
.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background-color: #f0f0f0;
  margin-right: 24rpx;
}

/* 物品信息 */
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-price {
  font-size: 32rpx;
  color: #ff4d4f;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.item-owner {
  font-size: 24rpx;
  color: #999999;
}

/* 取消收藏按钮 */
.unfavorite-btn {
  padding: 16rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  margin-left: 16rpx;
}

.unfavorite-text {
  font-size: 26rpx;
  color: #666666;
}

/* 加载更多 */
.load-more,
.no-more {
  text-align: center;
  padding: 40rpx 0;
}

.load-text,
.no-more-text {
  font-size: 26rpx;
  color: #999999;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333333;
  margin-bottom: 16rpx;
}

.empty-subtext {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 48rpx;
}

.browse-btn {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 40rpx;
  border: none;
}

/* 批量操作栏 */
.batch-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.select-all {
  display: flex;
  align-items: center;
}

.select-text {
  font-size: 28rpx;
  color: #333333;
  margin-left: 16rpx;
}

.batch-unfavorite-btn {
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 32rpx;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
}

.batch-unfavorite-btn[disabled] {
  background: #cccccc;
}
</style>
