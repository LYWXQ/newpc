<template>
  <view class="container">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-content">
        <text class="navbar-title">校园闲置共享</text>
      </view>
    </view>

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
        <swiper-item
          v-for="banner in bannerItems"
          :key="banner.id"
          @click="banner.itemId && goToDetail(banner.itemId)"
        >
          <image :src="banner.image" mode="aspectFill" />
          <view v-if="banner.itemId" class="banner-overlay">
            <text class="banner-title">{{ banner.title }}</text>
            <text class="banner-views">{{ banner.viewCount }}次浏览</text>
          </view>
        </swiper-item>
      </swiper>

      <!-- 推荐物品 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">热门推荐</text>
          <view class="section-more" @click="goToMore">
            <text>查看更多</text>
            <text class="section-more-arrow">＞</text>
          </view>
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
                  :src="getImageUrl(item.user?.avatar)"
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
          <view class="section-more" @click="goToMore">
            <text>查看更多</text>
            <text class="section-more-arrow">＞</text>
          </view>
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
  import { ref } from 'vue'
  import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
  import { getItemList, getCategories, type Item } from '@/api/items'
  import { getHotRecommendations } from '@/api/recommendations'
  import { isLoggedIn } from '@/utils/auth'
  import { useDeviceInfo } from '@/utils/device'
  import { getImageUrl } from '@/utils/image'

  const { statusBarHeight } = useDeviceInfo()

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

  interface BannerItem {
    id: string
    image: string
    title: string
    viewCount: number
    itemId?: number
  }

  const fallbackBannerItems: BannerItem[] = [
    { id: 'fallback-1', image: '/static/logo.png', title: '', viewCount: 0 },
    { id: 'fallback-2', image: '/static/logo.png', title: '', viewCount: 0 },
    { id: 'fallback-3', image: '/static/logo.png', title: '', viewCount: 0 },
  ]

  const bannerItems = ref<BannerItem[]>(fallbackBannerItems)
  const recommendedItems = ref<Item[]>([])
  const latestItems = ref<Item[]>([])
  const loading = ref(false)

  const loadHotBannerItems = async () => {
    try {
      const res = await getHotRecommendations({ limit: 3 })
      const items = res.items || []

      bannerItems.value = items.length > 0
        ? items.map((item: Item) => ({
            id: `hot-${item.id}`,
            image: getImageUrl(item.images?.[0]),
            title: item.title,
            viewCount: item.viewCount || 0,
            itemId: item.id,
          }))
        : fallbackBannerItems
    } catch (error) {
      console.error('加载热门轮播失败:', error)
      bannerItems.value = fallbackBannerItems
    }
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
      loadHotBannerItems(),
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
@import '@/uni.scss';

.container {
  min-height: 100vh;
  background-color: $bg-color;
  padding-top: calc(var(--status-bar-height) + 88rpx);
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: $primary-gradient;
  
  .navbar-content {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .navbar-title {
    font-size: $font-lg;
    font-weight: bold;
    color: #fff;
  }
}

.search-bar {
  padding: $spacing-md;
  background-color: #fff;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: $bg-color;
  border-radius: $radius-xl;
  padding: $spacing-sm $spacing-lg;
}

.icon-search {
  font-size: $font-md;
  margin-right: $spacing-sm;
  color: $text-hint;
}

.icon-clear {
  font-size: $font-lg;
  color: $text-hint;
  padding: $spacing-xs;
  margin-left: $spacing-xs;
}

.search-input input {
  flex: 1;
  font-size: $font-base;
  color: $text-primary;
}

.cancel-btn {
  margin-left: $spacing-md;
  font-size: $font-base;
  color: $primary-color;
}

.loading-state {
  padding: 60rpx 0;
  text-align: center;
  color: $text-hint;
  font-size: $font-base;
}

.search-results {
  padding: $spacing-md;
}

.category-scroll {
  white-space: nowrap;
  padding: $spacing-md;
  background-color: #fff;
  scrollbar-width: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-item {
  display: inline-block;
  padding: $spacing-sm $spacing-lg;
  margin-right: $spacing-sm;
  background-color: $bg-color;
  border-radius: $radius-xl;
  font-size: $font-sm;
  color: $text-secondary;
}

.category-item.active {
  background-color: $primary-color;
  color: #fff;
}

.transaction-filter {
  padding: $spacing-md;
  background-color: #fff;
  display: flex;
  gap: $spacing-sm;
}

.transaction-item {
  padding: $spacing-sm $spacing-lg;
  background-color: $bg-color;
  border-radius: $radius-xl;
  font-size: $font-sm;
  color: $text-secondary;
}

.transaction-item.active {
  background-color: $primary-color;
  color: #fff;
}

.banner {
  height: 300rpx;
  margin: $spacing-md;
  border-radius: $radius-lg;
  overflow: hidden;
}

.banner swiper-item {
  position: relative;
}

.banner image {
  width: 100%;
  height: 100%;
}

.banner-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent);
}

.banner-title {
  font-size: $font-lg;
  font-weight: bold;
  color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.banner-views {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.9);
}

.section {
  margin: $spacing-md;
  background-color: #fff;
  border-radius: $radius-lg;
  padding: $spacing-md;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
}

.section-more {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: $font-sm;
  color: $text-hint;
}

.section-more-arrow {
  font-size: $font-sm;
  line-height: 1;
  color: $text-hint;
}

.item-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.item-card {
  width: calc(50% - 10rpx);
  background-color: #fff;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.item-image {
  width: 100%;
  height: 240rpx;
}

.item-info {
  padding: $spacing-sm;
}

.item-title {
  font-size: $font-base;
  color: $text-primary;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: $spacing-sm;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.item-price {
  font-size: $font-lg;
  color: #ff6b6b;
  font-weight: bold;
}

.item-credit {
  font-size: $font-xs;
  color: $success-color;
  background-color: #f6ffed;
  padding: 4rpx 8rpx;
  border-radius: $radius-sm;
}

.item-user {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: $spacing-xs;
}

.user-name {
  font-size: $font-sm;
  color: $text-secondary;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.item-row {
  display: flex;
  padding: $spacing-sm;
  background-color: #f9f9f9;
  border-radius: $radius-md;
}

.item-thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: $radius-sm;
  margin-right: $spacing-md;
}

.item-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-name {
  font-size: $font-md;
  color: $text-primary;
  font-weight: 500;
}

.item-desc {
  font-size: $font-sm;
  color: $text-hint;
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
  font-size: $font-lg;
  color: #ff6b6b;
  font-weight: bold;
}

.item-deposit {
  font-size: $font-sm;
  color: $text-hint;
}

.empty-state {
  padding: 60rpx 0;
  text-align: center;
}

.empty-text {
  font-size: $font-base;
  color: $text-hint;
}
</style>