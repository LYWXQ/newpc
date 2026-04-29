---
name: wechat-auth
description: UniApp 微信登录授权指南。包含微信 OAuth2.0 授权、用户信息获取、token管理等功能。
metadata:
  author: UniApp Team
  version: "1.0.0"
  source: 基于微信开放平台文档整理
---

# 微信登录授权指南

## 概述

本 Skill 提供 UniApp 项目中集成微信登录授权的完整指南，包括 OAuth2.0 授权流程、用户信息获取、token管理等功能。

## 授权流程

### OAuth2.0 授权流程

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   用户授权   │────▶│  微信授权服务器  │────▶│   后端服务   │
│  获取 code   │     │   返回 code     │     │  获取用户信息 │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                            │
       │◀───────────────────────────────────────────│
       │              返回用户信息                   │
       ▼
┌─────────────┐
│   本地存储   │
│ token/用户信息│
└─────────────┘
```

## 代码实现

### 1. 微信登录获取 code

```typescript
async function getWechatCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('获取 code 失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
```

### 2. 使用 code 换取用户信息

```typescript
interface WechatAuthResult {
  token: string
  refreshToken: string
  expiresIn: number
  userInfo: UserInfo
}

async function wechatAuth(code: string): Promise<WechatAuthResult> {
  const result = await uni.request({
    url: '/api/auth/wechat',
    method: 'POST',
    data: { code }
  })
  return result.data
}
```

### 3. 完整登录流程

```typescript
export class WechatAuthService {
  /**
   * 微信登录
   */
  static async login(): Promise<UserInfo> {
    try {
      // 1. 获取微信 code
      const code = await getWechatCode()
      
      // 2. 使用 code 换取用户信息和 token
      const authResult = await wechatAuth(code)
      
      // 3. 存储 token 和用户信息
      await this.storeAuthInfo(authResult)
      
      // 4. 返回用户信息
      return authResult.userInfo
    } catch (error) {
      console.error('微信登录失败', error)
      throw error
    }
  }
  
  /**
   * 存储授权信息
   */
  static async storeAuthInfo(authResult: WechatAuthResult): Promise<void> {
    uni.setStorageSync('token', authResult.token)
    uni.setStorageSync('refreshToken', authResult.refreshToken)
    uni.setStorageSync('userInfo', JSON.stringify(authResult.userInfo))
    
    // 设置 token 过期时间
    const expiresAt = Date.now() + authResult.expiresIn * 1000
    uni.setStorageSync('tokenExpiresAt', expiresAt.toString())
  }
  
  /**
   * 检查 token 是否过期
   */
  static isTokenExpired(): boolean {
    const expiresAt = uni.getStorageSync('tokenExpiresAt')
    if (!expiresAt) return true
    return Date.now() > parseInt(expiresAt)
  }
  
  /**
   * 刷新 token
   */
  static async refreshToken(): Promise<void> {
    const refreshToken = uni.getStorageSync('refreshToken')
    if (!refreshToken) {
      throw new Error('没有 refresh token')
    }
    
    const result = await uni.request({
      url: '/api/auth/refresh',
      method: 'POST',
      data: { refreshToken }
    })
    
    await this.storeAuthInfo(result.data)
  }
  
  /**
   * 登出
   */
  static logout(): void {
    uni.removeStorageSync('token')
    uni.removeStorageSync('refreshToken')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('tokenExpiresAt')
  }
  
  /**
   * 获取当前用户信息
   */
  static getUserInfo(): UserInfo | null {
    const userInfo = uni.getStorageSync('userInfo')
    return userInfo ? JSON.parse(userInfo) : null
  }
}
```

### 4. 获取用户详细信息

```typescript
async function getUserProfile(): Promise<void> {
  uni.getUserProfile({
    desc: '用于完善会员资料',
    success: async (res) => {
      // 更新用户头像和昵称
      await uni.request({
        url: '/api/users/profile',
        method: 'PUT',
        data: {
          avatar: res.userInfo.avatarUrl,
          nickname: res.userInfo.nickName
        }
      })
      
      // 更新本地存储
      const userInfo = WechatAuthService.getUserInfo()
      if (userInfo) {
        userInfo.avatar = res.userInfo.avatarUrl
        userInfo.nickname = res.userInfo.nickName
        uni.setStorageSync('userInfo', JSON.stringify(userInfo))
      }
    },
    fail: (err) => {
      console.error('获取用户信息失败', err)
    }
  })
}
```

## 登录状态管理

### Pinia Store 示例

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const userInfo = ref<UserInfo | null>(null)
  
  const isLoggedIn = computed(() => !!token.value)
  
  function login(authResult: WechatAuthResult) {
    token.value = authResult.token
    userInfo.value = authResult.userInfo
    // 存储到本地
    uni.setStorageSync('token', authResult.token)
    uni.setStorageSync('userInfo', JSON.stringify(authResult.userInfo))
  }
  
  function logout() {
    token.value = ''
    userInfo.value = null
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }
  
  function loadFromStorage() {
    token.value = uni.getStorageSync('token') || ''
    const storedUser = uni.getStorageSync('userInfo')
    userInfo.value = storedUser ? JSON.parse(storedUser) : null
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    loadFromStorage
  }
})
```

## 后端接口示例

### 微信授权接口

```typescript
// 请求格式
interface WechatAuthRequest {
  code: string
}

// 响应格式
interface WechatAuthResponse {
  token: string
  refreshToken: string
  expiresIn: number
  userInfo: UserInfo
}
```

### 用户信息接口

```typescript
interface UserInfo {
  id: string
  openid: string
  nickname: string
  avatar: string
  phone?: string
  createdAt: string
}
```

## 注意事项

### 1. 授权类型
- **静默授权**: 只获取 openid，无需用户同意
- **手动授权**: 获取用户头像、昵称等信息，需要用户同意

### 2. Scope 参数
```typescript
// 静默授权
uni.login({ provider: 'weixin' })

// 手动授权（获取用户信息）
uni.getUserProfile({ desc: '描述' })
```

### 3. Token 管理
- 设置合理的过期时间
- 实现 refresh token 机制
- 定期检查 token 有效性

### 4. 数据安全
- HTTPS 传输
- Token 加密存储
- 避免明文传输敏感信息

### 5. 兼容性
- 检查 API 可用性
- 处理不同微信版本差异
- 提供备用登录方式

## 常见问题

### Q: 获取 code 失败
A: 检查微信 AppID 配置是否正确，确保在微信开发者工具或真机上测试

### Q: 用户信息为空
A: 微信不再返回完整用户信息，需要使用 `uni.getUserProfile()` 主动获取

### Q: token 过期
A: 实现 refresh token 自动刷新机制

## 使用场景

- 用户登录注册
- 用户信息获取
- 权限验证
- 个性化服务

## API 速查

| API | 功能 |
|-----|------|
| `uni.login()` | 获取微信登录 code |
| `uni.getUserProfile()` | 获取用户信息 |
| `uni.setStorageSync()` | 存储数据 |
| `uni.getStorageSync()` | 获取存储数据 |
| `uni.removeStorageSync()` | 删除存储数据 |
