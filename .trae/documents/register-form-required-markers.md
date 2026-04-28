# 注册界面必填项标记 - 实施计划

## 任务概述
在注册界面对必填内容添加标记（如红色星号 *），让用户清楚知道哪些字段是必填的。

## 当前注册表单字段分析

### 必填字段（已有验证逻辑）
1. **学号** - 有验证 `if (!studentId.value.trim())`
2. **用户名** - 有验证 `if (!username.value.trim())`
3. **密码** - 有验证 `if (!password.value.trim())`
4. **确认密码** - 有验证 `if (password.value !== confirmPassword.value)`
5. **用户协议** - 有验证 `if (!agreed.value)`

### 非必填字段
1. **学校** - 无必填验证，可选填
2. **专业** - 无必填验证，可选填

## 实施步骤

### 步骤 1: 修改注册页面模板
**文件**: `frontend/src/pages/register/register.vue`

修改内容：
- 为学号、用户名、密码、确认密码的标签添加红色星号标记
- 保持学校、专业标签不变（不加星号）
- 在表单底部添加说明文字："* 为必填项"

### 步骤 2: 添加样式
**文件**: `frontend/src/pages/register/register.vue` (style部分)

添加样式：
- 必填标记的样式（红色星号）
- 底部说明文字的样式

## 具体修改方案

### 模板修改
```vue
<!-- 必填项示例 -->
<view class="form-item">
  <text class="label">
    <text class="required">*</text>
    学号
  </text>
  <input ... />
</view>

<!-- 非必填项示例 -->
<view class="form-item">
  <text class="label">学校</text>
  <input ... />
</view>

<!-- 底部说明 -->
<view class="required-hint">
  <text class="required">*</text>
  <text>为必填项</text>
</view>
```

### 样式添加
```scss
.required {
  color: #ff4d4f;
  margin-right: 4rpx;
}

.required-hint {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
  text-align: left;
}
```

## 验收标准
- [ ] 学号标签前显示红色星号
- [ ] 用户名标签前显示红色星号
- [ ] 密码标签前显示红色星号
- [ ] 确认密码标签前显示红色星号
- [ ] 学校标签前不显示星号
- [ ] 专业标签前不显示星号
- [ ] 表单底部有"* 为必填项"的说明文字
- [ ] 样式美观，与现有UI风格一致
