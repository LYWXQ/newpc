---
name: wechat-pay
description: UniApp 微信支付集成指南。包含支付流程、订单管理、退款等功能的完整实现说明。
metadata:
  author: UniApp Team
  version: "1.0.0"
  source: 基于微信支付官方文档整理
---

# 微信支付集成指南

## 概述

本 Skill 提供 UniApp 项目中集成微信支付的完整指南，包括支付流程、订单管理、退款等功能。

## 支付流程

### 完整支付流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   前端发起   │────▶│   后端处理   │────▶│   微信支付平台   │
│  订单请求    │     │ 生成预支付   │     │   处理支付      │
└─────────────┘     └─────────────┘     └─────────────────┘
       │                  │                       │
       │◀─────────────────│                       │
       │   返回支付参数   │                       │
       ▼                                       │
┌─────────────┐                                 │
│   调用支付   │─────────────────────────────────▶
│  uni.request │              │
│   Payment    │◀─────────────┘
└─────────────┘       支付结果回调
       │
       ▼
┌─────────────┐
│ 更新订单状态 │
└─────────────┘
```

## 代码实现

### 1. 创建订单并获取支付参数

```typescript
// 前端代码
async function createOrder(orderData: OrderData) {
  try {
    // 1. 创建订单
    const createResult = await uni.request({
      url: '/api/orders',
      method: 'POST',
      data: orderData
    })
    
    const orderId = createResult.data.orderId
    
    // 2. 获取支付参数
    const payResult = await uni.request({
      url: '/api/pay/wechat',
      method: 'POST',
      data: { orderId }
    })
    
    return payResult.data
  } catch (error) {
    console.error('创建订单失败', error)
    throw error
  }
}
```

### 2. 发起微信支付

```typescript
async function requestWechatPay(payParams: WechatPayParams) {
  return new Promise<void>((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
      success: () => {
        console.log('支付成功')
        resolve()
      },
      fail: (err) => {
        console.error('支付失败', err)
        reject(err)
      },
      complete: () => {
        console.log('支付完成')
      }
    })
  })
}
```

### 3. 完整支付流程封装

```typescript
export class WechatPayService {
  /**
   * 发起支付
   * @param orderData 订单数据
   */
  static async pay(orderData: OrderData): Promise<void> {
    try {
      // 1. 创建订单并获取支付参数
      const payParams = await createOrder(orderData)
      
      // 2. 发起支付
      await requestWechatPay(payParams)
      
      // 3. 查询订单状态
      await this.checkOrderStatus(orderData.orderId)
      
      // 4. 更新本地状态
      uni.showToast({
        title: '支付成功',
        icon: 'success'
      })
    } catch (error) {
      uni.showToast({
        title: '支付失败',
        icon: 'none'
      })
      throw error
    }
  }
  
  /**
   * 检查订单状态
   */
  static async checkOrderStatus(orderId: string): Promise<OrderStatus> {
    const result = await uni.request({
      url: `/api/orders/${orderId}/status`,
      method: 'GET'
    })
    return result.data.status
  }
}
```

## 后端接口示例

### 支付参数接口

```typescript
// 后端接口响应格式
interface WechatPayParams {
  timeStamp: string      // 时间戳
  nonceStr: string       // 随机字符串
  package: string        // 预支付交易会话标识
  signType: string       // 签名类型
  paySign: string        // 签名
}
```

### 订单状态枚举

```typescript
type OrderStatus = 
  | 'pending'    // 待支付
  | 'paid'       // 已支付
  | 'shipped'    // 已发货
  | 'completed'  // 已完成
  | 'cancelled'  // 已取消
  | 'refunded'   // 已退款
```

## 退款功能

### 发起退款

```typescript
async function requestRefund(orderId: string, reason: string) {
  try {
    const result = await uni.request({
      url: `/api/pay/refund`,
      method: 'POST',
      data: {
        orderId,
        reason
      }
    })
    
    if (result.data.success) {
      uni.showToast({
        title: '退款申请已提交',
        icon: 'success'
      })
    }
  } catch (error) {
    uni.showToast({
      title: '退款失败',
      icon: 'none'
    })
  }
}
```

## 支付注意事项

### 1. 签名验证
- 确保后端签名算法正确
- 使用正确的密钥
- 注意参数排序

### 2. 异步通知
- 必须处理微信支付异步通知
- 验证通知签名
- 幂等性处理

### 3. 订单状态同步
- 支付成功后主动查询订单状态
- 处理网络异常情况
- 设置合理的超时时间

### 4. 错误处理
- 支付失败后的重试机制
- 用户取消支付的处理
- 网络异常的处理

## 调试技巧

### 1. 使用微信开发者工具
- 开启调试模式
- 查看网络请求
- 调试支付流程

### 2. 测试支付
- 使用微信支付测试账号
- 测试不同支付场景
- 模拟支付失败情况

### 3. 日志记录
- 记录支付请求日志
- 记录支付结果日志
- 便于问题排查

## 常见问题

### Q: 支付提示签名错误
A: 检查签名算法、密钥、参数排序是否正确

### Q: 支付成功但订单状态未更新
A: 检查异步通知是否正常处理

### Q: 支付失败如何重试
A: 重新获取支付参数后再次调用

## 使用场景

- 商品购买支付
- 服务费用支付
- 会员充值
- 订单退款

## API 速查

| API | 功能 |
|-----|------|
| `uni.requestPayment()` | 发起微信支付 |
| `uni.showToast()` | 显示支付结果提示 |
| `uni.request()` | 调用后端接口 |
