# 修复批量取消收藏并优化选择交互

## 问题分析

### 问题1：批量取消收藏失败（404错误）
- **原因**：路由定义顺序问题，`/batch` 路由定义在 `/:itemId` 路由之后
- **影响**：Express 将 `/batch` 解析为 `itemId="batch"`，导致 404 错误

### 问题2：批量选择交互不友好
- **现状**：必须点击复选框才能选中
- **优化**：点击整个列表项即可选中/取消选中

## 修复方案

### 步骤1：修复后端路由顺序
**文件**：`backend/routes/favorites.js`

**修改内容**：
- 将 `/batch` 路由移动到 `/:itemId` 路由之前
- 确保 Express 正确匹配 `/batch` 路径

### 步骤2：优化前端批量选择交互
**文件**：`frontend/src/pages/favorites/favorites.vue`

**修改内容**：
1. 修改列表项点击事件：
   - 批量模式下，点击整个列表项切换选中状态
   - 非批量模式下，点击跳转到物品详情

2. 移除复选框的单独点击事件，避免事件冲突

3. 优化视觉反馈：
   - 选中状态添加背景色高亮
   - 未选中状态保持默认样式

## 具体实现

### 后端路由修复
```javascript
// 批量取消收藏 - 必须放在 /:itemId 之前
router.delete('/batch', favoriteController.batchRemoveFavorites);

// 取消收藏
router.delete('/:itemId', favoriteController.removeFavorite);
```

### 前端交互优化
```vue
<!-- 列表项点击事件优化 -->
<view 
  class="favorite-item" 
  :class="{ 'selected': isBatchMode && selectedItems.includes(favorite.item.id) }"
  v-for="favorite in favorites" 
  :key="favorite.id"
  @click="handleItemClick(favorite.item.id)"
>
  <!-- 复选框仅作为视觉指示器，不单独处理点击 -->
  <view class="checkbox" v-if="isBatchMode">
    <text class="checkbox-icon" :class="{ 'checked': selectedItems.includes(favorite.item.id) }">
      {{ selectedItems.includes(favorite.item.id) ? '✓' : '' }}
    </text>
  </view>
  <!-- ... 其他内容 -->
</view>
```

```typescript
// 处理列表项点击
const handleItemClick = (itemId: number) => {
  if (isBatchMode.value) {
    toggleSelect(itemId)
  } else {
    goToItemDetail(itemId)
  }
}
```

```scss
// 选中状态样式
.favorite-item.selected {
  background-color: #e6f7ff;
  border: 2rpx solid #007aff;
}
```

## 验证清单

- [ ] 批量取消收藏 API 返回 200 成功状态
- [ ] 批量模式下点击列表项可切换选中状态
- [ ] 选中项有视觉高亮反馈
- [ ] 非批量模式下点击列表项正常跳转详情页
- [ ] 全选/取消全选功能正常
- [ ] 批量取消收藏后列表正确更新
