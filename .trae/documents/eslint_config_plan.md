# ESLint 规范配置计划

## 1. 项目现状分析

### 当前状态
- **技术栈**: UniApp + Vue 3 + TypeScript + Vite
- **现有工具**: 已配置 TypeScript 类型检查 (`vue-tsc`)
- **缺失工具**: ESLint 代码检查工具

### 代码冗余问题识别
通过之前的分析，项目中存在以下问题：
- 登录检查逻辑重复（已部分优化）
- API 调用模式重复
- 页面逻辑相似性高
- 工具函数分散

### 目标
1. 安装并配置 ESLint
2. 配置适合 Vue 3 + TypeScript 的规则
3. 运行检查并修复问题
4. 集成到开发流程中

## 2. ESLint 配置方案

### 2.1 安装依赖
| 依赖 | 版本 | 用途 |
|------|------|------|
| eslint | ^8.x | ESLint 核心 |
| @typescript-eslint/eslint-plugin | ^6.x | TypeScript 规则 |
| @typescript-eslint/parser | ^6.x | TypeScript 解析器 |
| eslint-plugin-vue | ^9.x | Vue 规则 |
| eslint-config-standard | ^17.x | Standard 风格 |
| eslint-plugin-import | ^2.x | import 规则 |
| eslint-plugin-n | ^16.x | Node.js 规则 |
| eslint-plugin-promise | ^6.x | Promise 规则 |

### 2.2 配置文件结构
```
frontend/
├── .eslintrc.js          # ESLint 主配置
├── .eslintignore         # 忽略文件列表
└── package.json          # 添加 lint 脚本
```

### 2.3 ESLint 规则配置要点

#### 基础规则
- `parser`: `@typescript-eslint/parser`
- `extends`: 
  - `eslint:recommended`
  - `plugin:vue/vue3-recommended`
  - `@typescript-eslint/recommended`
  - `standard`

#### Vue 规则
- `vue/html-indent`: 4 空格缩进
- `vue/max-attributes-per-line`: 单行最多 3 个属性
- `vue/component-name-in-template-casing`: PascalCase

#### TypeScript 规则
- `@typescript-eslint/no-unused-vars`: 检测未使用变量
- `@typescript-eslint/explicit-function-return-type`: 显式返回类型
- `@typescript-eslint/no-explicit-any`: 禁止 any 类型

#### 代码风格规则
- `no-console`: 开发环境允许 console
- `no-debugger`: 生产环境禁止 debugger
- `indent`: 4 空格缩进

## 3. 实施步骤

### 步骤1: 安装 ESLint 依赖
```bash
npm install eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-vue eslint-config-standard eslint-plugin-import eslint-plugin-n eslint-plugin-promise --save-dev
```

### 步骤2: 创建 ESLint 配置文件
创建 `.eslintrc.js` 配置规则

### 步骤3: 创建忽略文件
创建 `.eslintignore` 忽略不需要检查的文件

### 步骤4: 添加 npm 脚本
在 `package.json` 中添加 lint 命令

### 步骤5: 运行 ESLint 检查
```bash
npm run lint
```

### 步骤6: 修复发现的问题
根据 ESLint 输出修复代码问题

### 步骤7: 集成到开发流程
配置 IDE 自动检查

## 4. 配置文件内容

### .eslintrc.js
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@typescript-eslint/recommended',
    'standard'
  ],
  plugins: [
    '@typescript-eslint',
    'vue'
  ],
  rules: {
    // Vue 规则
    'vue/html-indent': ['error', 4],
    'vue/max-attributes-per-line': ['error', { singleline: 3, multiline: 1 }],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/no-unused-vars': 'error',
    
    // TypeScript 规则
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // 代码风格
    'indent': ['error', 4],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  }
}
```

### .eslintignore
```
node_modules/
dist/
build/
*.d.ts
*.config.js
vite.config.ts
```

### package.json 脚本
```json
{
  "scripts": {
    "lint": "eslint . --ext .vue,.ts,.js",
    "lint:fix": "eslint . --ext .vue,.ts,.js --fix"
  }
}
```

## 5. 风险评估

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|----------|
| 规则冲突 | 中 | ESLint 规则与现有代码风格冲突 | 逐步调整规则，先使用警告级别 |
| 大量错误 | 中 | 首次运行可能发现大量问题 | 分批修复，优先修复错误级别 |
| 构建失败 | 低 | ESLint 配置错误导致构建失败 | 配置前备份，测试配置 |

## 6. 验收标准

- [ ] ESLint 安装完成
- [ ] 配置文件创建完成
- [ ] lint 脚本添加完成
- [ ] 运行 `npm run lint` 无错误
- [ ] 运行 `npm run lint:fix` 自动修复可修复问题
- [ ] IDE 集成 ESLint 检查

## 7. 预期效果

### 优化前
- 代码风格不一致
- 潜在的未使用变量
- 类型安全隐患（any 类型）
- 无统一的代码检查

### 优化后
- 统一的代码风格
- 自动检测未使用变量
- 提示潜在的类型问题
- 集成到开发流程，实时检查

## 8. 执行计划

| 步骤 | 任务 | 时间 |
|------|------|------|
| 1 | 安装 ESLint 依赖 | 10 分钟 |
| 2 | 创建配置文件 | 15 分钟 |
| 3 | 添加 npm 脚本 | 5 分钟 |
| 4 | 运行 ESLint 检查 | 10 分钟 |
| 5 | 修复代码问题 | 30-60 分钟 |
| 6 | 验证修复效果 | 10 分钟 |

## 9. 后续维护

- 定期更新 ESLint 规则
- 团队成员遵守编码规范
- 代码提交前运行 lint 检查
- 在 CI/CD 流程中集成 ESLint
