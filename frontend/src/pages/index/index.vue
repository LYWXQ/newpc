<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="icon-search">🔍</text>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索闲置物品"
          @input="handleInput"
          @confirm="handleSearch"
        >
        <text class="icon-clear" v-if="searchKeyword" @click="clearSearch">✕</text>
      </view>
      <text class="cancel-btn" v-if="isSearching" @click="cancelSearch">取消</text>
    </view>

    <!-- 搜索结果区域 -->
    <view v-if="isSearching">
      <view class="loading-state" v-if="searchLoading">
        <text>搜索中...</text>
      </view>
      
      <view class="search-results" v-else-if="searchResults.length > 0">
        <view class="item-list">
          <view
            class="item-row"
            v-for="item in searchResults"
            :key="item.id"
            @click="goToDetail(item.id)"
          >
            <image
              class="item-thumb"
              :src="getImageUrl(item.images?.[0])"
              mode="aspectFill"
            />
            <view class="item-detail">
              <text class="item-name">{{ item.title }}</text>
              <text class="item-desc">{{ item.description || "暂无描述" }}</text>
              <view class="item-footer">
                <text class="item-rent">¥{{ item.price }}/天</text>
                <text class="item-deposit">押金: ¥{{ item.deposit }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else-if="searchKeyword">
        <text class="empty-text">未找到相关物品</text>
      </view>
    </view>

    <!-- 首页内容 -->
    <view v-else>
      <!-- 分类标签 -->
      <scroll-view 
        class="category-scroll" 
        scroll-x 
        :scroll-into-view="currentCategoryId"
        scroll-with-animation
        :show-scrollbar="false"
      >
        <view
          class="category-item"
          v-for="(cat, index) in categories"
          :key="index"
          :id="'cat-' + index"
          :class="{ active: currentCategory === cat }"
          @click="selectCategory(cat, index)"
        >
          {{ cat }}
        </view>
      </scroll-view>

      <!-- 交易类型筛选 -->
      <view class="transaction-filter">
        <view
          class="transaction-item"
          v-for="(type, index) in transactionTypes"
          :key="index"
          :class="{ active: currentTransactionType === type.value }"
          @click="selectTransactionType(type.value)"
        >
          {{ type.label }}
        </view>
      </view>

      <!-- 轮播图 -->
      <swiper class="banner"
              indicator-dots
              autoplay
              circular>
        <swiper-item v-for="(banner, index) in banners" :key="index">
          <image :src="banner" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <!-- 推荐物品 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">热门推荐</text>
          <text class="section-more" @click="goToMore">查看更多 ></text>
        </view>

        <view class="item-grid" v-if="recommendedItems.length > 0">
          <view
            class="item-card"
            v-for="item in recommendedItems"
            :key="item.id"
            @click="goToDetail(item.id)"
          >
            <image
              class="item-image"
              :src="getImageUrl(item.images?.[0])"
              mode="aspectFill"
            />
            <view class="item-info">
              <text class="item-title">{{ item.title }}</text>
              <view class="item-meta">
                <text class="item-price">¥{{ item.price }}/天</text>
                <text class="item-credit"
                >信用分: {{ item.user?.creditScore || 100 }}</text
                >
              </view>
              <view class="item-user">
                <image
                  class="user-avatar"
                  :src="item.user?.avatar || '/static/logo.png'"
                />
                <text class="user-name">{{
                  item.user?.username || "未知用户"
                }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="empty-state" v-else>
          <text class="empty-text">暂无推荐物品</text>
        </view>
      </view>

      <!-- 最新发布 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">最新发布</text>
          <text class="section-more" @click="goToMore">查看更多 ></text>
        </view>

        <view class="item-list" v-if="latestItems.length > 0">
          <view
            class="item-row"
            v-for="item in latestItems"
            :key="item.id"
            @click="goToDetail(item.id)"
          >
            <image
              class="item-thumb"
              :src="getImageUrl(item.images?.[0])"
              mode="aspectFill"
            />
            <view class="item-detail">
              <text class="item-name">{{ item.title }}</text>
              <text class="item-desc">{{ item.description || "暂无描述" }}</text>
              <view class="item-footer">
                <text class="item-rent">¥{{ item.price }}/天</text>
                <text class="item-deposit">押金: ¥{{ item.deposit }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="empty-state" v-else>
          <text class="empty-text">暂无最新物品</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
  import { getItemList, getCategories, type Item } from '@/api/items'
  import { isLoggedIn } from '@/utils/auth'

  const searchKeyword = ref('')
  const isSearching = ref(false)
  const searchLoading = ref(false)
  const searchResults = ref<Item[]>([])
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  const currentCategory = ref('全部')
  const currentCategoryId = ref('cat-0')
  const currentTransactionType = ref<string | null>(null)
  const transactionTypes = ref([
    { label: '全部', value: null },
    { label: '免费', value: 'free' },
    { label: '可租', value: 'rent' },
    { label: '购买', value: 'sell' },
  ])
  const categories = ref([
    '全部',
    '图书',
    '电子产品',
    '运动器材',
    '生活用品',
    '服装',
    '其他',
  ])

  const banners = ['/static/logo.png', '/static/logo.png', '/static/logo.png']

  const recommendedItems = ref<Item[]>([])
  const latestItems = ref<Item[]>([])
  const loading = ref(false)

  // 获取图片完整 URL
  const getImageUrl = (url?: string) => {
    if (!url) return '/static/logo.png'
    if (url.startsWith('http')) return url
    return `http://localhost:3000${url}`
  }

  // 加载推荐物品（按浏览量排序）
  const loadRecommendedItems = async (category?: string, transactionType?: string) => {
    try {
      const params: any = {
        page: 1,
        limit: 4,
        sort: 'newest',
      }
      if (category && category !== '全部') {
        params.category = category
      }
      if (transactionType) {
        params.transactionType = transactionType
      }
      const res = await getItemList(params)
      recommendedItems.value = res.items || []
    } catch (error) {
      console.error('加载推荐物品失败:', error)
      recommendedItems.value = []
    }
  }

  // 加载最新物品
  const loadLatestItems = async (category?: string, transactionType?: string) => {
    try {
      const params: any = {
        page: 1,
        limit: 5,
        sort: 'newest',
      }
      if (category && category !== '全部') {
        params.category = category
      }
      if (transactionType) {
        params.transactionType = transactionType
      }
      const res = await getItemList(params)
      latestItems.value = res.items || []
    } catch (error) {
      console.error('加载最新物品失败:', error)
      latestItems.value = []
    }
  }

  // 加载分类
  const loadCategories = async () => {
    try {
      const cats = await getCategories()
      categories.value = cats
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  // 加载所有数据
  const loadData = async () => {
    loading.value = true
    await Promise.all([
      loadRecommendedItems(currentCategory.value, currentTransactionType.value || undefined),
      loadLatestItems(currentCategory.value, currentTransactionType.value || undefined),
      loadCategories(),
    ])
    loading.value = false
  }

  // 加载筛选数据
  const loadFilteredData = async () => {
    loading.value = true
    await Promise.all([
      loadRecommendedItems(currentCategory.value, currentTransactionType.value || undefined),
      loadLatestItems(currentCategory.value, currentTransactionType.value || undefined),
    ])
    loading.value = false
  }

  onLoad(() => {
    if (!isLoggedIn()) {
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    loadData()
  })

  onShow(() => {
    if (!isLoggedIn()) {
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    loadData()
  })

  // 下拉刷新
  onPullDownRefresh(async () => {
    await loadData()
    uni.stopPullDownRefresh()
  })

  const handleInput = () => {
    if (!searchKeyword.value) {
      clearSearch()
      return
    }
  
    isSearching.value = true
  
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  
    searchTimeout = setTimeout(() => {
      performSearch()
    }, 300)
  }

  const handleSearch = async () => {
    if (searchKeyword.value) {
      isSearching.value = true
      await performSearch()
    }
  }

  const performSearch = async () => {
    try {
      searchLoading.value = true
      const res = await getItemList({
        keyword: searchKeyword.value,
        page: 1,
        limit: 20,
      })
      searchResults.value = res.items || []
    } catch (error) {
      console.error('搜索失败:', error)
      uni.showToast({
        title: '搜索失败',
        icon: 'none',
      })
    } finally {
      searchLoading.value = false
    }
  }

  const clearSearch = () => {
    searchKeyword.value = ''
    searchResults.value = []
    isSearching.value = false
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  }

  const cancelSearch = () => {
    clearSearch()
  }

  const selectCategory = (cat: string, index: number) => {
    currentCategory.value = cat
    currentCategoryId.value = `cat-${index}`
    loadFilteredData()
  }

  const selectTransactionType = (type: string | null) => {
    currentTransactionType.value = type
    loadFilteredData()
  }

  const goToDetail = (id: number) => {
    uni.navigateTo({
      url: `/pages/item-detail/item-detail?id=${id}`,
    })
  }

  const goToMore = () => {
    uni.navigateTo({
      url: '/pages/search/search',
    })
  }
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.search-bar {
  padding: 20rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
}

.icon-search {
  font-size: 28rpx;
  margin-right: 12rpx;
  color: #999;
}

.icon-clear {
  font-size: 32rpx;
  color: #999;
  padding: 4rpx;
  margin-left: 8rpx;
}

.search-input input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.cancel-btn {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #007aff;
}

.loading-state {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.search-results {
  padding: 20rpx;
}

.category-scroll {
  white-space: nowrap;
  padding: 20rpx;
  background-color: #fff;
  scrollbar-width: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-item {
  display: inline-block;
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
  background-color: #f5f5f5;
  border-radius: 28rpx;
  font-size: 26rpx;
  color: #666;
}

.category-item.active {
  background-color: #007aff;
  color: #fff;
}

.transaction-filter {
  padding: 20rpx;
  background-color: #fff;
  display: flex;
  gap: 16rpx;
}

.transaction-item {
  padding: 12rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 28rpx;
  font-size: 26rpx;
  color: #666;
}

.transaction-item.active {
  background-color: #007aff;
  color: #fff;
}

.banner {
  height: 300rpx;
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.banner image {
  width: 100%;
  height: 100%;
}

.section {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 26rpx;
  color: #999;
}

.item-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.item-card {
  width: calc(50% - 10rpx);
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.item-image {
  width: 100%;
  height: 240rpx;
}

.item-info {
  padding: 16rpx;
}

.item-title {
  font-size: 28rpx;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.item-price {
  font-size: 32rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.item-credit {
  font-size: 22rpx;
  color: #52c41a;
  background-color: #f6ffed;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
}

.item-user {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}

.user-name {
  font-size: 24rpx;
  color: #666;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.item-row {
  display: flex;
  padding: 16rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}

.item-thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.item-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.item-desc {
  font-size: 24rpx;
  color: #999;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-rent {
  font-size: 32rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.item-deposit {
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  padding: 60rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
