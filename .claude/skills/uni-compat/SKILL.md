---
name: uni-compat
description: UniApp H5和微信小程序兼容性处理工具，提供统一的跨平台解决方案
metadata:
  author: Trae AI
  version: "1.0.0"
  source: 校园闲置共享平台项目
---

# UniApp 兼容性处理技能包

## 简介

本技能包提供 UniApp 项目中 H5 和微信小程序的兼容性处理方案，包括统一的 API 封装、条件编译工具和跨平台适配策略。

## 核心功能

### 1. 统一 API 封装

#### 1.1 图片处理工具
**文件**: `src/utils/image.ts`

```typescript
/**
 * 获取图片URL - 兼容H5和小程序
 * @param imagePath 图片路径（可能为undefined/null/string）
 * @returns 完整的图片URL
 */
export const getImageUrl = (imagePath?: string | null): string => {
  // 空值检查 - 防止 TypeError
  if (!imagePath || typeof imagePath !== 'string') {
    return 'https://via.placeholder.com/100x100?text=No+Image'
  }
  
  // 完整URL直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // 相对路径处理
  return `${BASE_URL}${imagePath}`
}
```

#### 1.2 网络请求封装
**文件**: `src/utils/request.ts`

```typescript
/**
 * 统一请求配置
 * - H5: 使用标准HTTP请求
 * - 小程序: 使用uni.request
 */
const request = async (options: RequestOptions) => {
  // 自动添加token
  const token = getToken()
  if (token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.message || 'Request failed'))
        }
      },
      fail: (err) => {
        // 统一错误处理
        handleRequestError(err)
        reject(err)
      }
    })
  })
}
```

### 2. 条件编译指南

#### 2.1 模板中的条件编译

```vue
<template>
  <!-- #ifdef H5 -->
  <view class="h5-only">H5专属内容</view>
  <!-- #endif -->
  
  <!-- #ifdef MP-WEIXIN -->
  <view class="wx-only">微信小程序专属内容</view>
  <!-- #endif -->
  
  <!-- #ifndef H5 -->
  <view>非H5平台显示</view>
  <!-- #endif -->
</template>
```

#### 2.2 Script中的条件编译

```typescript
// #ifdef H5
console.log('H5平台')
// #endif

// #ifdef MP-WEIXIN
console.log('微信小程序')
// #endif

// #ifndef H5
console.log('非H5平台')
// #endif
```

#### 2.3 样式中的条件编译

```scss
/* #ifdef H5 */
.h5-style {
  font-size: 16px;
}
/* #endif */

/* #ifdef MP-WEIXIN */
.wx-style {
  font-size: 28rpx;
}
/* #endif */
```

### 3. 平台检测工具

**文件**: `src/utils/platform.ts`

```typescript
import { ref } from 'vue'

const platform = ref<'h5' | 'mp-weixin' | 'app' | 'unknown'>('unknown')

export const initPlatform = () => {
  uni.getSystemInfo({
    success: (res) => {
      // #ifdef H5
      platform.value = 'h5'
      // #endif
      
      // #ifdef MP-WEIXIN
      platform.value = 'mp-weixin'
      // #endif
      
      // #ifdef APP-PLUS
      platform.value = 'app'
      // #endif
    }
  })
}

export const usePlatform = () => platform

export const isH5 = () => platform.value === 'h5'
export const isWeChat = () => platform.value === 'mp-weixin'
export const isApp = () => platform.value === 'app'
```

### 4. 安全区域适配

#### 4.1 设备信息工具
**文件**: `src/utils/device.ts`

```typescript
import { ref } from 'vue'

const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const isIPhoneX = ref(false)

export const initDeviceInfo = (): Promise<void> => {
  return new Promise((resolve) => {
    uni.getSystemInfo({
      success: (res) => {
        statusBarHeight.value = res.statusBarHeight || 0
        
        // iPhone X及以上机型检测
        isIPhoneX.value = /iphone/gi.test(res.model) && 
          (res.screenHeight === 812 || res.screenHeight === 896 || 
           res.screenHeight === 844 || res.screenHeight === 926 ||
           res.screenHeight === 1024)
        
        // 底部安全区域计算
        if (res.safeArea && res.safeArea.bottom) {
          safeAreaBottom.value = res.safeArea.bottom - res.windowHeight + res.safeArea.height
        }
        
        resolve()
      },
      fail: () => resolve()
    })
  })
}

export const useDeviceInfo = () => ({
  statusBarHeight,
  safeAreaBottom,
  isIPhoneX
})
```

#### 4.2 安全区域样式

```scss
/* 安全区域Mixin */
@mixin safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

@mixin safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

/* 使用示例 */
.page-container {
  min-height: 100vh;
  @include safe-area-inset;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  @include safe-area-bottom;
}
```

### 5. 常见兼容性问题及解决方案

| 问题 | H5表现 | 小程序表现 | 解决方案 |
|------|--------|-----------|----------|
| 滚动穿透 | 正常 | 滚动区域外滚动 | 使用 `catchtouchmove` |
| 样式单位 | px/em/rem | rpx | 使用rpx |
| 网络请求 | 跨域问题 | 域名白名单 | 配置代理/白名单 |
| 存储 | localStorage | uni.setStorage | 使用uni API |
| 图片预览 | window.open | uni.previewImage | 使用uni API |
| 导航 | window.location | uni.navigateTo | 使用uni API |

### 6. 构建命令

```json
{
  "scripts": {
    "dev:h5": "uni",
    "build:h5": "uni build",
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:mp-weixin": "uni build -p mp-weixin"
  }
}
```

## 使用建议

1. **优先使用 uni API**: 尽可能使用 uni-app 提供的跨平台 API
2. **条件编译隔离**: 平台特定代码使用条件编译隔离
3. **统一工具函数**: 将通用逻辑封装为工具函数
4. **测试覆盖**: 在H5和小程序环境都进行测试
5. **文档更新**: 保持兼容性文档同步更新