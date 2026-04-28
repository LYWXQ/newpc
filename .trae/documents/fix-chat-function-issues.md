# 修复聊天功能异常

## 问题分析

根据截图中的错误信息，聊天功能存在以下问题：

### 问题1: TypeError: Cannot read properties of null (reading 'addEventListener')
- **原因**: 聊天页面中的 scroll-view 或其他组件在尝试添加事件监听器时，目标元素为 null
- **影响**: 页面无法正常滚动，可能导致消息列表显示异常

### 问题2: TypeError: Cannot set properties of null (setting 'scrollTop')
- **原因**: 尝试设置 scrollTop 属性时，目标元素为 null
- **影响**: 无法自动滚动到最新消息

### 问题3: 401 Unauthorized 错误
- **原因**: 用户未登录或 token 过期，访问 /api/messages 接口被拒绝
- **影响**: 无法获取消息列表

### 问题4: showLoading 与 hideLoading 未配对使用
- **原因**: 代码中调用了 showLoading 但没有对应的 hideLoading，或者调用顺序异常
- **影响**: 可能导致加载提示一直显示

## 修复方案

### 步骤1: 修复聊天页面 scroll-view 相关问题
**文件**: `frontend/src/pages/chat/chat.vue`

**修改内容**:
1. 添加对 scroll-view 引用的空值检查
2. 在 scrollToBottom 函数中添加安全判断
3. 确保组件挂载后再操作 DOM

### 步骤2: 修复消息列表页面 401 错误
**文件**: `frontend/src/pages/messages/messages.vue`

**修改内容**:
1. 在页面加载时检查登录状态
2. 如果未登录，跳转到登录页面
3. 添加 token 过期处理

### 步骤3: 修复 showLoading/hideLoading 配对问题
**文件**: `frontend/src/utils/request.ts`

**修改内容**:
1. 确保每个 showLoading 都有对应的 hideLoading
2. 在错误处理中确保 hideLoading 被调用
3. 使用 try-finally 确保资源释放

## 具体实现

### 聊天页面修复
```typescript
// 在 chat.vue 中修改 scrollToBottom 函数
const scrollToBottom = () => {
  nextTick(() => {
    // 添加延迟确保 DOM 已更新
    setTimeout(() => {
      scrollTop.value = 99999
    }, 100)
  })
}

// 添加 scroll-view 的 ref 引用
const scrollViewRef = ref<any>(null)

// 修改模板中的 scroll-view
<scroll-view
  ref="scrollViewRef"
  class="chat-content"
  scroll-y
  :scroll-top="scrollTop"
  :scroll-with-animation="true"
  @scrolltoupper="loadMoreMessages"
>
```

### 消息列表页面修复
```typescript
// 在 messages.vue 中添加登录检查
onMounted(() => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  fetchMessageList(true)
})
```

### 请求工具修复
```typescript
// 在 request.ts 中确保 hideLoading 被调用
const request = async (options: any) => {
  let showLoadingFlag = false
  try {
    if (options.showLoading) {
      showLoading()
      showLoadingFlag = true
    }
    // ... 请求逻辑
  } catch (error) {
    // ... 错误处理
  } finally {
    if (showLoadingFlag) {
      hideLoading()
    }
  }
}
```

## 验证清单

- [ ] 聊天页面可以正常滚动
- [ ] 发送消息后自动滚动到底部
- [ ] 未登录用户访问消息页面被重定向到登录页
- [ ] 登录后可以正常获取消息列表
- [ ] showLoading 和 hideLoading 配对使用，无警告
- [ ] 聊天功能端到端测试通过
