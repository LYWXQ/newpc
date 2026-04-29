# task-report - 任务完成报告技能包

## 概述

本技能包用于生成标准化的任务完成报告，包括修改内容、验证结果、问题和建议。

## 使用方式

### 1. 生成任务报告

```typescript
import { generateReport, printReport } from '@/utils/task-report'

const task: Task = {
  id: 'task-001',
  title: '修复聊天页面滚动问题',
  priority: 'P0',
  status: 'completed',
  description: '修复发送消息后页面不自动滚动到底部的问题',
  filesModified: ['src/pages/chat/chat.vue', 'src/utils/image.ts'],
  testRequirements: [
    { id: 'TR-1', description: '聊天消息列表滚动流畅', type: 'human-judgment', status: 'passed' },
    { id: 'TR-2', description: '发送消息后自动滚动到底部', type: 'human-judgment', status: 'passed' }
  ]
}

const report = generateReport(task)
printReport(report)
```

### 2. 输出示例

```
============================================================
任务完成报告
============================================================
任务名称: 修复聊天页面滚动问题
优先级: P0
状态: completed

摘要:
任务「修复聊天页面滚动问题」已完成。验证结果：通过 2/2 (100%)，失败 0，待验证 0。

改进建议:
1. 建议运行 eslint 检查代码质量
2. 建议添加单元测试覆盖核心逻辑
3. 建议在多个平台进行兼容性测试
4. 建议更新相关文档

============================================================
```

### 3. 导出报告

```typescript
// 导出为Markdown
const mdReport = exportReport(report, 'markdown')

// 导出为JSON
const jsonReport = exportReport(report, 'json')
```

## 报告模板

### 标准格式

```markdown
## 任务完成报告

### 一、任务概述
- **任务名称**: [任务名称]
- **优先级**: [P0/P1/P2]
- **状态**: ✅ 已完成

### 二、完成内容

| 修改项 | 文件路径 | 修改类型 |
|:---|:---|:---|
| [描述] | `/path/to/file` | 添加/修改/删除 |

### 三、验证结果

| 验证项 | 状态 |
|:---|:---|
| [验证点] | ✅ 通过 |

### 四、改进建议

1. [建议1]
2. [建议2]
```