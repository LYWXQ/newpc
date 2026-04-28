# 注册页可滚动区域优化 - 实施计划

## 任务概述
注册页面内容过多，需要将信息填写区域设置为可滚动，确保在移动端小屏幕设备上也能正常显示和使用。

## 当前问题分析

### 当前布局结构
- 整个页面使用 `min-height: 100vh`，内容超出时会撑开页面
- 头部标题区域 + 表单区域全部在一个容器内
- 在小屏幕手机上，表单内容可能超出视口，导致：
  - 用户需要滚动整个页面
  - 注册按钮可能被推到屏幕外
  - 用户体验不佳

### 需要优化的点
1. 表单区域需要独立滚动
2. 头部标题保持固定或随页面滚动
3. 注册按钮始终可见或容易访问
4. 移动端适配，确保在各种屏幕尺寸下正常显示

## 实施步骤

### 步骤 1: 修改页面结构
**文件**: `frontend/src/pages/register/register.vue`

将页面结构改为：
```vue
<template>
  <view class="register-container">
    <!-- 固定头部 -->
    <view class="register-header">
      <text class="title">注册账号</text>
      <text class="subtitle">加入校园闲置共享平台</text>
    </view>
    
    <!-- 可滚动表单区域 -->
    <scroll-view class="form-scroll-view" scroll-y>
      <view class="register-form">
        <!-- 所有表单项 -->
        ...
      </view>
    </scroll-view>
  </view>
</template>
```

### 步骤 2: 修改样式
**文件**: `frontend/src/pages/register/register.vue` (style部分)

修改容器样式：
```scss
.register-container {
  height: 100vh;  // 改为固定高度
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 40rpx;
  box-sizing: border-box;
}

.register-header {
  margin-bottom: 40rpx;
  margin-top: 20rpx;
  flex-shrink: 0;  // 防止头部被压缩
}

.form-scroll-view {
  flex: 1;  // 占据剩余空间
  overflow-y: auto;
}

.register-form {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
}
```

### 步骤 3: 移动端适配优化
- 调整内边距，在小屏幕上减少padding
- 调整表单项间距
- 确保输入框高度适合移动端触摸

## 具体修改方案

### 模板修改
1. 将 `register-form` 包裹在 `scroll-view` 中
2. 设置 `scroll-view` 的 `scroll-y` 属性启用垂直滚动
3. 保持头部在滚动区域外

### 样式修改
1. `.register-container`: 
   - `min-height: 100vh` → `height: 100vh`
   - 添加 `display: flex; flex-direction: column;`
   - 调整padding

2. `.register-header`:
   - 调整margin
   - 添加 `flex-shrink: 0;`

3. 新增 `.form-scroll-view`:
   - `flex: 1;`
   - `overflow-y: auto;`

4. `.register-form`:
   - 调整padding为 `40rpx`
   - 确保底部有足够的空间

5. `.form-item`:
   - 调整margin-bottom，移动端适当减小

## 移动端适配考虑

### 小屏幕手机（< 375px）
- 减少整体padding
- 减小表单项间距
- 确保输入框高度不小于44px（触摸友好）

### 大屏幕手机（> 414px）
- 保持现有样式
- 表单可能不需要滚动

### 平板设备
- 限制最大宽度
- 居中显示

## 验收标准
- [ ] 表单区域可以独立滚动
- [ ] 头部标题始终可见
- [ ] 在小屏幕手机上所有表单项都可访问
- [ ] 滚动流畅，无卡顿
- [ ] 移动端触摸体验良好
- [ ] 各种屏幕尺寸下显示正常
- [ ] 学校下拉菜单在滚动区域内正常工作
