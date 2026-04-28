# 首页标签栏滚动优化实现计划

## 需求分析
1. 隐藏首页界面标签的滚动条（不影响滚动功能）
2. 标签选中后自动左右居中（非严格居中，位置中间靠左）

## 研究结论
- 当前分类标签使用 `scroll-view` 组件实现横向滚动
- 需要添加 CSS 隐藏滚动条
- 需要计算每个标签的位置，实现选中标签时自动滚动居中

## 文件修改
- `frontend/src/pages/index/index.vue` - 主要修改文件

## 实现步骤

### 1. 隐藏滚动条
- 在 `.category-scroll` 样式中添加 `scrollbar-width: none` (Firefox)
- 添加 `::-webkit-scrollbar { display: none; }` (Chrome/Safari)

### 2. 实现自动滚动居中
- 为 `scroll-view` 添加 `:scroll-into-view` 绑定
- 为每个标签添加唯一的 id
- 在 `selectCategory` 函数中设置当前选中标签的 id
- 计算滚动位置，使选中标签保持中间靠左位置

## 技术考虑
- 使用 uni-app 的 scroll-view 组件的 scroll-into-view 属性
- 确保在不同平台（H5、小程序）上都能正常工作
- 滚动动画需要平滑

## 风险与解决方案
- **风险**: 不同平台 scroll-view 行为有差异
- **方案**: 使用 uni-app 提供的标准 API，确保兼容性
