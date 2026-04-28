<template>
  <view class="container">
    <view class="search-header">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          placeholder="搜索物品"
          v-model="searchQuery"
          @confirm="handleSearch"
          @input="handleInput"
        />
        <text class="clear-button" @click="clearSearch" v-if="searchQuery">✕</text>
      </view>
      <button class="cancel-button" @click="cancelSearch">取消</button>
    </view>
    
    <!-- 分类标签筛选 -->
    <view class="category-filter">
      <scroll-view scroll-x class="category-scroll">
        <view
          class="category-tag"
          :class="{ active: currentCategory === '' }"
          @click="selectCategory('')"
        >
          全部
        </view>
        <view
          class="category-tag"
          v-for="cat in categories"
          :key="cat"
          :class="{ active: currentCategory === cat }"
          @click="selectCategory(cat)"
        >
          {{ cat }}
        </view>
      </scroll-view>
    </view>
    
    <view class="search-content">
      <!-- 搜索历史 -->
      <view class="search-history" v-if="searchHistory.length > 0 && !showResults && !searchQuery">
        <view class="history-header">
          <text class="history-title">搜索历史</text>
          <text class="clear-history" @click="clearHistory">清空</text>
        </view>
        <view class="history-tags">
          <view
            class="tag"
            v-for="(item, index) in searchHistory"
            :key="index"
            @click="searchFromHistory(item)"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view class="hot-search" v-if="!showResults && !searchQuery">
        <text class="hot-title">热门搜索</text>
        <view class="hot-tags">
          <view
            class="tag"
            v-for="(tag, index) in hotTags"
            :key="index"
            @click="searchFromHistory(tag)"
          >
            {{ tag }}
          </view>
        </view>
      </view>

      <!-- 搜索结果 -->
      <view class="search-results" v-if="showResults">
        <scroll-view
          scroll-y
          class="result-scroll"
          @scrolltolower="loadMore"
          :refresher-enabled="true"
          :refresher-triggered="isRefreshing"
          @refresherrefresh="onRefresh"
        >
          <view
            class="result-item"
            v-for="item in searchResults"
            :key="item.id"
            @click="goToDetail(item.id)"
          >
            <image
              class="result-image"
              :src="item.images && item.images.length > 0 ? item.images[0] : '/static/logo.png'"
              mode="aspectFill"
            ></image>
            <view class="result-info">
              <text class="result-title">{{ item.title }}</text>
              <text class="result-price">¥{{ item.price.toFixed(2) }}/天</text>
              <text class="result-owner">发布者：{{ item.user?.username || '未知用户' }}</text>
            </view>
          </view>

          <!-- 加载状态 -->
          <view class="load-more" v-if="loading">
            <text>加载中...</text>
          </view>
          <view class="no-more" v-if="!hasMore && searchResults.length > 0">
            <text>没有更多了</text>
          </view>
          <view class="empty-result" v-if="searchResults.length === 0 && !loading">
            <text>暂无搜索结果</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getItemList, getCategories, type Item } from '@/api/items';

const searchQuery = ref('');
const showResults = ref(false);
const searchResults = ref<Item[]>([]);
const searchHistory = ref<string[]>([]);
const hotTags = ref(['数码产品', '体育用品', '考研资料', '生活用品', '乐器']);

// 分类相关
const categories = ref<string[]>([]);
const currentCategory = ref('');

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const hasMore = ref(true);
const loading = ref(false);
const isRefreshing = ref(false);

// 本地存储键名
const HISTORY_KEY = 'search_history';

// 页面加载时获取搜索历史和分类
onMounted(() => {
  loadSearchHistory();
  loadCategories();
  // 检查是否有分类参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const category = currentPage.$page?.options?.category;
  if (category && category !== '全部') {
    currentCategory.value = category;
    showResults.value = true;
    fetchSearchResults();
  }
});

// 加载分类
const loadCategories = async () => {
  try {
    const cats = await getCategories();
    categories.value = cats.filter(cat => cat !== '全部');
  } catch (error) {
    console.error('加载分类失败', error);
  }
};

// 选择分类
const selectCategory = (category: string) => {
  currentCategory.value = category;
  // 重置分页并搜索
  currentPage.value = 1;
  hasMore.value = true;
  searchResults.value = [];
  showResults.value = true;
  fetchSearchResults();
};

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const history = uni.getStorageSync(HISTORY_KEY);
    if (history) {
      searchHistory.value = JSON.parse(history);
    }
  } catch (e) {
    console.error('加载搜索历史失败', e);
  }
};

// 保存搜索历史
const saveSearchHistory = (keyword: string) => {
  if (!keyword.trim()) return;

  // 去重并移到最前面
  const newHistory = [keyword, ...searchHistory.value.filter(item => item !== keyword)];
  // 最多保存 10 条
  searchHistory.value = newHistory.slice(0, 10);

  try {
    uni.setStorageSync(HISTORY_KEY, JSON.stringify(searchHistory.value));
  } catch (e) {
    console.error('保存搜索历史失败', e);
  }
};

// 清空搜索历史
const clearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清空搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchHistory.value = [];
        try {
          uni.removeStorageSync(HISTORY_KEY);
        } catch (e) {
          console.error('清空搜索历史失败', e);
        }
      }
    }
  });
};

// 从历史记录搜索
const searchFromHistory = (keyword: string) => {
  searchQuery.value = keyword;
  handleSearch();
};

// 输入处理（防抖）
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const handleInput = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    if (!searchQuery.value.trim()) {
      showResults.value = false;
      searchResults.value = [];
    }
  }, 300);
};

// 执行搜索
const handleSearch = async () => {
  const keyword = searchQuery.value.trim();
  if (!keyword) {
    uni.showToast({
      title: '请输入搜索关键词',
      icon: 'none'
    });
    return;
  }

  // 保存搜索历史
  saveSearchHistory(keyword);

  // 重置分页
  currentPage.value = 1;
  hasMore.value = true;
  searchResults.value = [];
  showResults.value = true;

  await fetchSearchResults();
};

// 获取搜索结果
const fetchSearchResults = async () => {
  if (loading.value) return;

  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    };
    
    // 添加关键词搜索
    if (searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim();
    }
    
    // 添加分类筛选
    if (currentCategory.value) {
      params.category = currentCategory.value;
    }
    
    const res = await getItemList(params);
    
    const resItems = res.items || [];

    if (currentPage.value === 1) {
      searchResults.value = resItems;
    } else {
      searchResults.value = [...searchResults.value, ...resItems];
    }

    // 判断是否还有更多
    hasMore.value = resItems.length === pageSize.value;
  } catch (error) {
    console.error('搜索失败', error);
    uni.showToast({
      title: '搜索失败，请重试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
    isRefreshing.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  currentPage.value++;
  fetchSearchResults();
};

// 下拉刷新
const onRefresh = () => {
  isRefreshing.value = true;
  currentPage.value = 1;
  hasMore.value = true;
  fetchSearchResults();
};

// 清空搜索
const clearSearch = () => {
  searchQuery.value = '';
  showResults.value = false;
  searchResults.value = [];
};

// 取消搜索，返回上一页
const cancelSearch = () => {
  uni.navigateBack();
};

// 跳转到物品详情页
const goToDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/item/detail?id=${id}`
  });
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background-color: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 24rpx;
  padding: 0 16rpx;
  margin-right: 16rpx;
}

.search-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
  color: #999999;
}

.search-input {
  flex: 1;
  font-size: 24rpx;
  padding: 12rpx 0;
}

.clear-button {
  font-size: 24rpx;
  color: #999999;
  padding: 0 8rpx;
}

.cancel-button {
  font-size: 24rpx;
  color: #007aff;
  padding: 0 8rpx;
  background: none;
  border: none;
}

.search-content {
  padding: 16rpx;
}

/* 分类筛选 */
.category-filter {
  background-color: #ffffff;
  padding: 16rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.category-scroll {
  white-space: nowrap;
  padding: 0 16rpx;
}

.category-tag {
  display: inline-block;
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
  background-color: #f5f5f5;
  border-radius: 28rpx;
  font-size: 26rpx;
  color: #666666;
  border: 2rpx solid transparent;
}

.category-tag.active {
  background-color: #667eea;
  color: #ffffff;
  border-color: #667eea;
}

/* 搜索历史 */
.search-history {
  margin-bottom: 32rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.history-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.clear-history {
  font-size: 24rpx;
  color: #999999;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

/* 热门搜索 */
.hot-search {
  margin-bottom: 32rpx;
}

.hot-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
  display: block;
  color: #333333;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  background-color: #ffffff;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666666;
  border: 2rpx solid #e5e5e5;
}

/* 搜索结果 */
.search-results {
  margin-top: 16rpx;
  height: calc(100vh - 120rpx);
}

.result-scroll {
  height: 100%;
}

.result-item {
  display: flex;
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
}

.result-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
}

.result-info {
  flex: 1;
}

.result-title {
  font-size: 24rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  display: block;
  color: #333333;
}

.result-price {
  font-size: 24rpx;
  color: #ff4d4f;
  margin-bottom: 8rpx;
  display: block;
}

.result-owner {
  font-size: 20rpx;
  color: #999999;
  display: block;
}

/* 加载状态 */
.load-more,
.no-more,
.empty-result {
  text-align: center;
  padding: 32rpx;
  color: #999999;
  font-size: 24rpx;
}
</style>
