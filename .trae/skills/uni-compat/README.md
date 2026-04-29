# uni-compat - UniApp兼容性处理技能包

## 概述

本技能包提供 UniApp 项目中 H5 和微信小程序的兼容性处理方案。

## 使用方式

### 1. 在代码中使用

```typescript
// 导入工具函数
import { getImageUrl } from '@/utils/image'
import { useDeviceInfo } from '@/utils/device'
import { isH5, isWeChat } from '@/utils/platform'

// 使用图片处理
const url = getImageUrl(item.image)

// 使用设备信息
const { statusBarHeight, safeAreaBottom } = useDeviceInfo()

// 平台判断
if (isH5()) {
  // H5特定逻辑
}

if (isWeChat()) {
  // 微信小程序特定逻辑
}
```

### 2. 条件编译

```vue
<template>
  <!-- #ifdef H5 -->
  <view>H5专属内容</view>
  <!-- #endif -->
  
  <!-- #ifdef MP-WEIXIN -->
  <view>微信小程序专属内容</view>
  <!-- #endif -->
</template>
```

### 3. 安全区域适配

```scss
@import '@/uni.scss';

.bottom-bar {
  position: fixed;
  bottom: 0;
  @include safe-area-bottom;
}
```

## 文件结构

```
src/
├── utils/
│   ├── image.ts      # 图片处理工具
│   ├── device.ts     # 设备信息工具
│   ├── platform.ts   # 平台检测工具
│   └── request.ts    # 网络请求封装
└── uni.scss          # 全局样式变量和Mixin
```

## 构建命令

```bash
# H5开发
npm run dev:h5

# H5构建
npm run build:h5

# 微信小程序开发
npm run dev:mp-weixin

# 微信小程序构建
npm run build:mp-weixin
```