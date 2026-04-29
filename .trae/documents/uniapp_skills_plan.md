# UniApp 微信小程序 Skills 安装计划

## 1. 现状分析

### 当前已安装的 UniApp 相关 Skills

| Skill名称 | 路径 | 状态 |
|-----------|------|------|
| uniapp | `.trae/skills/uniapp/` | ✅ 已安装 |
| uni-helper | `.trae/skills/uni-helper/` | ✅ 已安装 |
| uniapp-development | `.trae/skills/uniapp-development/` | ✅ 已安装 |

### 当前 Skills 内容

**uniapp/** 包含：
- config-manifest.md - manifest.json 配置
- config-pages.md - pages.json 配置
- core-form-components.md - 表单组件
- core-framework.md - 核心框架
- core-view-components.md - 视图组件
- feature-file-operations.md - 文件操作
- feature-lifecycle.md - 生命周期
- feature-location.md - 定位功能
- feature-media-components.md - 媒体组件
- feature-navigation.md - 页面导航
- feature-network.md - 网络请求
- feature-storage.md - 数据存储
- feature-system-info.md - 系统信息
- feature-ui-feedback.md - UI反馈

**uni-helper/** 包含：
- lib-uni-network.md - 网络工具
- lib-uni-promises.md - Promise封装
- lib-uni-typed.md - 类型定义
- lib-uni-use.md - 组合式函数
- plugin-components.md - 组件插件
- plugin-layouts.md - 布局插件
- plugin-manifest.md - 配置插件

## 2. 需要补充的 Skills

### 建议添加的 UniApp 微信小程序 Skills

| Skill名称 | 用途 | 优先级 |
|-----------|------|--------|
| 微信小程序 API | 微信特有API使用指南 | P0 |
| 小程序支付 | 微信支付集成 | P1 |
| 小程序分享 | 分享功能实现 | P1 |
| 小程序登录 | 微信授权登录 | P0 |
| 小程序云开发 | 云开发指南 | P2 |
| 小程序分包 | 分包加载优化 | P2 |

## 3. 安装计划

### 步骤1: 更新现有 uniapp Skill
- 补充微信小程序特有内容
- 添加微信API说明

### 步骤2: 创建微信小程序专项 Skill
- 创建 `wechat-miniprogram` skill
- 包含微信特有API文档

### 步骤3: 创建微信支付 Skill
- 创建 `wechat-pay` skill
- 包含支付集成指南

### 步骤4: 创建微信登录 Skill
- 创建 `wechat-auth` skill
- 包含OAuth授权流程

## 4. 创建的文件

| 文件路径 | 说明 |
|----------|------|
| `.trae/skills/wechat-miniprogram/SKILL.md` | 微信小程序API文档 |
| `.trae/skills/wechat-miniprogram/references/` | 参考文档目录 |
| `.trae/skills/wechat-pay/SKILL.md` | 微信支付集成指南 |
| `.trae/skills/wechat-auth/SKILL.md` | 微信登录授权指南 |

## 5. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 文档过时 | 低 | 定期更新文档 |
| API变更 | 低 | 标注API版本 |

## 6. 验收标准

- [ ] 创建 wechat-miniprogram skill
- [ ] 创建 wechat-pay skill
- [ ] 创建 wechat-auth skill
- [ ] 文档内容完整且准确
