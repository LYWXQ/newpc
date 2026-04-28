# 修复 scroll-view 滚动条隐藏问题

## 问题分析
根据 uni-app 官方文档，scroll-view 的滚动条设置在不同平台有差异：
- `::-webkit-scrollbar` 仅在 webview 渲染时有效
- 小程序平台需要使用 `show-scrollbar` 属性
- App-nvue 平台有专门的 `show-scrollbar` 属性支持

## 当前实现
- 已添加 CSS `scrollbar-width: none` 和 `::-webkit-scrollbar { display: none; }`
- 但缺少 uni-app 特有的 `show-scrollbar` 属性控制

## 修复方案

### 1. 添加 show-scrollbar 属性
在 scroll-view 组件上添加 `:show-scrollbar="false"` 属性，这是 uni-app 提供的跨平台解决方案。

### 2. 增强 CSS 兼容性
确保 CSS 隐藏滚动条在各个平台都能生效。

## 文件修改
- `frontend/src/pages/index/index.vue`
  - 修改 scroll-view 组件，添加 `show-scrollbar="false"`

## 技术细节
- `show-scrollbar` 属性在 App-nvue 2.1.5+ 支持
- 在 webview 渲染时，CSS 方式仍然有效
- 两者结合使用可以覆盖更多平台
