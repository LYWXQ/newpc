---
name: wechat-miniprogram
description: UniApp 微信小程序开发指南。包含微信小程序特有API、支付、分享、登录等功能的使用说明。
metadata:
  author: UniApp Team
  version: "1.0.0"
  source: 基于微信小程序官方文档整理
---

# UniApp 微信小程序开发

## 概述

本 Skill 提供 UniApp 开发微信小程序的完整指南，包括微信特有API的使用、支付集成、登录授权等功能。

## 核心功能

### 1. 微信小程序基础

#### 1.1 小程序配置

**manifest.json 微信相关配置：**
```json
{
  "mp-weixin": {
    "appid": "wx1234567890abcdef",
    "setting": {
      "urlCheck": false
    },
    "usingComponents": true
  }
}
```

**pages.json 微信配置：**
```json
{
  "pages": [...],
  "globalStyle": {
    "navigationBarTextStyle": "black"
  },
  "mp-weixin": {
    "navigationBarTextStyle": "black"
  }
}
```

### 2. 微信登录

#### 2.1 获取微信用户信息

```typescript
// 获取微信登录 code
uni.login({
  provider: 'weixin',
  success: (res) => {
    console.log('登录成功', res.code)
    // 将 code 发送到后端换取 openid
  }
})

// 获取用户信息
uni.getUserProfile({
  desc: '用于完善会员资料',
  success: (res) => {
    console.log('用户信息', res.userInfo)
  }
})
```

#### 2.2 静默授权（仅获取 openid）

```typescript
uni.login({
  success: (res) => {
    if (res.code) {
      // 发送 code 到后端
      uni.request({
        url: '/api/auth/wechat',
        method: 'POST',
        data: { code: res.code },
        success: (authRes) => {
          console.log('授权成功', authRes.data)
        }
      })
    }
  }
})
```

### 3. 微信支付

#### 3.1 发起支付

```typescript
uni.requestPayment({
  provider: 'wxpay',
  timeStamp: '1600000000',
  nonceStr: 'abcdef123456',
  package: 'prepay_id=wx1234567890',
  signType: 'MD5',
  paySign: 'abcdef1234567890',
  success: (res) => {
    console.log('支付成功', res)
  },
  fail: (err) => {
    console.error('支付失败', err)
  }
})
```

#### 3.2 支付流程

```
1. 前端发起订单请求
2. 后端生成预支付订单
3. 后端返回支付参数
4. 前端调用 uni.requestPayment
5. 微信回调后端通知
6. 后端更新订单状态
7. 前端查询订单状态
```

### 4. 微信分享

#### 4.1 分享给朋友

```typescript
uni.showShareMenu({
  withShareTicket: true,
  menus: ['shareAppMessage', 'shareTimeline']
})

// 监听分享
uni.onShareAppMessage(() => {
  return {
    title: '分享标题',
    path: '/pages/index/index',
    imageUrl: 'https://example.com/share.jpg'
  }
})
```

#### 4.2 分享到朋友圈

```typescript
uni.onShareTimeline(() => {
  return {
    title: '分享标题',
    imageUrl: 'https://example.com/share.jpg'
  }
})
```

### 5. 微信小程序特有API

#### 5.1 获取小程序码

```typescript
// 通过云函数获取
uni.cloud.callFunction({
  name: 'getQRCode',
  data: {
    path: '/pages/index/index',
    width: 430
  },
  success: (res) => {
    console.log('二维码', res.result)
  }
})
```

#### 5.2 小程序更新

```typescript
const updateManager = uni.getUpdateManager()

updateManager.onCheckForUpdate((res) => {
  if (res.hasUpdate) {
    console.log('有新版本')
  }
})

updateManager.onUpdateReady(() => {
  uni.showModal({
    title: '更新提示',
    content: '新版本已准备好，是否重启应用？',
    success: (res) => {
      if (res.confirm) {
        updateManager.applyUpdate()
      }
    }
  })
})
```

#### 5.3 订阅消息

```typescript
uni.requestSubscribeMessage({
  tmplIds: ['abc123', 'def456'],
  success: (res) => {
    console.log('订阅成功', res)
  }
})
```

### 6. 微信小程序优化

#### 6.1 分包加载

**pages.json 配置：**
```json
{
  "pages": ["pages/index/index"],
  "subpackages": [
    {
      "root": "packageA",
      "pages": ["pages/a/index"]
    }
  ]
}
```

#### 6.2 懒加载组件

```vue
<template>
  <view>
    <lazy-component v-if="showComponent" />
  </view>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'

const showComponent = ref(false)
const LazyComponent = defineAsyncComponent(() => 
  import('./LazyComponent.vue')
)
</script>
```

### 7. 注意事项

1. **AppID 配置**: 确保在 manifest.json 中正确配置微信 AppID
2. **域名白名单**: 在微信公众平台配置业务域名
3. **TLS 证书**: 接口必须使用 HTTPS
4. **版本兼容**: 使用 `uni.canIUse()` 检查 API 兼容性
5. **审核规范**: 遵守微信小程序审核规范

## 使用场景

- 开发微信小程序原生功能
- 集成微信登录和支付
- 实现分享功能
- 优化小程序性能

## 常用 API 速查

| API | 功能 |
|-----|------|
| `uni.login()` | 微信登录 |
| `uni.getUserProfile()` | 获取用户信息 |
| `uni.requestPayment()` | 发起支付 |
| `uni.showShareMenu()` | 显示分享菜单 |
| `uni.getUpdateManager()` | 获取更新管理器 |
| `uni.requestSubscribeMessage()` | 订阅消息 |
