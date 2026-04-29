---
name: task-report
description: 任务完成报告技能包，用于功能修改、添加、删除后的完成情况汇报和建议提出
metadata:
  author: Trae AI
  version: "1.0.0"
  source: 校园闲置共享平台项目
---

# 任务完成报告技能包

## 简介

本技能包提供标准化的任务完成报告模板和工具，用于在完成功能修改、添加或删除后生成清晰的完成情况汇报，并提出改进建议。

## 核心功能

### 1. 任务状态枚举

```typescript
enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked'
}

enum Priority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2'
}

enum VerificationType {
  PROGRAMMATIC = 'programmatic',
  HUMAN_JUDGMENT = 'human-judgment'
}
```

### 2. 任务报告模板

#### 2.1 标准报告格式

```markdown
## 任务完成报告

### 一、任务概述
- **任务名称**: [任务名称]
- **优先级**: [P0/P1/P2]
- **状态**: ✅ 已完成 | ⚠️ 进行中 | ❌ 阻塞

### 二、完成内容

| 修改项 | 文件路径 | 修改类型 | 说明 |
|:---|:---|:---|:---|
| [修改描述] | `/path/to/file` | 添加/修改/删除 | [详细说明] |

### 三、验证结果

| 验证项 | 状态 | 说明 |
|:---|:---|:---|
| [验证点1] | ✅ 通过 | [验证方法] |
| [验证点2] | ✅ 通过 | [验证方法] |

### 四、问题与风险

| 问题 | 严重程度 | 影响范围 | 应对措施 |
|:---|:---|:---|:---|
| [问题描述] | 高/中/低 | [受影响模块] | [解决方案] |

### 五、改进建议

1. [建议1]
2. [建议2]

### 六、后续任务

- [ ] [待办任务1]
- [ ] [待办任务2]
```

#### 2.2 Bug修复报告格式

```markdown
## Bug修复报告

### 一、问题描述
**错误类型**: [功能错误/显示错误/性能问题]
**影响范围**: [具体页面/模块]
**严重程度**: [高/中/低]

### 二、根因分析
[详细分析问题产生的根本原因]

### 三、修复方案
**修改文件**: `/path/to/file`
**修复内容**:
```typescript
// 修复前
oldCode()

// 修复后
newCode()
```

### 四、验证结果
- ✅ [验证点1]
- ✅ [验证点2]
- ⚠️ [待验证项]

### 五、回归测试
[说明是否需要回归测试及测试范围]
```

### 3. 报告生成工具

#### 3.1 任务状态跟踪

```typescript
interface Task {
  id: string
  title: string
  priority: Priority
  status: TaskStatus
  description: string
  filesModified: string[]
  testRequirements: TestRequirement[]
  notes?: string
}

interface TestRequirement {
  id: string
  description: string
  type: VerificationType
  status: 'passed' | 'failed' | 'pending'
  notes?: string
}

interface CompletionReport {
  task: Task
  completedAt: Date
  summary: string
  issues: Issue[]
  suggestions: string[]
  nextSteps: string[]
}

const generateReport = (task: Task): CompletionReport => {
  const passedTests = task.testRequirements.filter(tr => tr.status === 'passed')
  const failedTests = task.testRequirements.filter(tr => tr.status === 'failed')
  const pendingTests = task.testRequirements.filter(tr => tr.status === 'pending')
  
  return {
    task,
    completedAt: new Date(),
    summary: generateSummary(task, passedTests.length, failedTests.length, pendingTests.length),
    issues: generateIssues(task),
    suggestions: generateSuggestions(task),
    nextSteps: generateNextSteps(task)
  }
}

const generateSummary = (task: Task, passed: number, failed: number, pending: number): string => {
  const total = task.testRequirements.length
  const completionRate = total > 0 ? ((passed / total) * 100).toFixed(0) : '100'
  
  return `任务「${task.title}」已完成。验证结果：通过 ${passed}/${total} (${completionRate}%)，失败 ${failed}，待验证 ${pending}。`
}
```

#### 3.2 建议生成逻辑

```typescript
const generateSuggestions = (task: Task): string[] => {
  const suggestions: string[] = []
  
  // 代码质量检查
  if (task.filesModified.some(file => file.endsWith('.ts') || file.endsWith('.vue'))) {
    suggestions.push('建议运行 eslint 检查代码质量')
    suggestions.push('建议添加单元测试覆盖核心逻辑')
  }
  
  // 性能检查
  if (task.description.includes('滚动') || task.description.includes('列表')) {
    suggestions.push('建议进行性能测试，确保滚动流畅')
  }
  
  // 兼容性检查
  if (task.description.includes('适配') || task.description.includes('H5') || task.description.includes('小程序')) {
    suggestions.push('建议在多个平台进行兼容性测试')
  }
  
  // 文档更新
  suggestions.push('建议更新相关文档')
  
  return suggestions
}

const generateIssues = (task: Task): Issue[] => {
  const issues: Issue[] = []
  const failedTests = task.testRequirements.filter(tr => tr.status === 'failed')
  
  failedTests.forEach(test => {
    issues.push({
      id: test.id,
      description: test.description,
      severity: 'high',
      location: task.filesModified.join(', '),
      suggestion: '请检查并修复失败的测试用例'
    })
  })
  
  return issues
}
```

### 4. 报告输出格式

#### 4.1 控制台输出

```typescript
const printReport = (report: CompletionReport): void => {
  console.log('='.repeat(60))
  console.log('任务完成报告')
  console.log('='.repeat(60))
  console.log(`任务名称: ${report.task.title}`)
  console.log(`优先级: ${report.task.priority}`)
  console.log(`状态: ${report.task.status}`)
  console.log('')
  console.log('摘要:')
  console.log(report.summary)
  console.log('')
  
  if (report.issues.length > 0) {
    console.log('问题列表:')
    report.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.description}`)
    })
    console.log('')
  }
  
  console.log('改进建议:')
  report.suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion}`)
  })
  
  if (report.nextSteps.length > 0) {
    console.log('')
    console.log('后续任务:')
    report.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`)
    })
  }
  
  console.log('='.repeat(60))
}
```

#### 4.2 格式化输出示例

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

后续任务:
1. 测试聊天功能完整流程
2. 验证其他页面滚动行为

============================================================
```

### 5. 工具方法

#### 5.1 任务状态更新

```typescript
const updateTaskStatus = (taskId: string, newStatus: TaskStatus): void => {
  // 更新任务状态逻辑
  const task = findTask(taskId)
  if (task) {
    task.status = newStatus
    saveTasks()
  }
}

const markTestPassed = (taskId: string, testId: string): void => {
  const task = findTask(taskId)
  if (task) {
    const test = task.testRequirements.find(tr => tr.id === testId)
    if (test) {
      test.status = 'passed'
    }
  }
}
```

#### 5.2 报告导出

```typescript
const exportReport = (report: CompletionReport, format: 'markdown' | 'json'): string => {
  if (format === 'json') {
    return JSON.stringify(report, null, 2)
  }
  
  // Markdown格式
  let md = `## 任务完成报告\n\n`
  md += `### 任务信息\n`
  md += `- **名称**: ${report.task.title}\n`
  md += `- **优先级**: ${report.task.priority}\n`
  md += `- **完成时间**: ${report.completedAt.toLocaleString()}\n\n`
  md += `### 摘要\n${report.summary}\n\n`
  
  if (report.issues.length > 0) {
    md += `### 问题列表\n`
    report.issues.forEach((issue, index) => {
      md += `${index + 1}. **${issue.severity}**: ${issue.description}\n`
    })
    md += '\n'
  }
  
  md += `### 改进建议\n`
  report.suggestions.forEach((suggestion, index) => {
    md += `${index + 1}. ${suggestion}\n`
  })
  
  return md
}
```

## 使用建议

1. **统一报告格式**: 所有任务完成后使用标准报告格式
2. **及时更新状态**: 任务状态变化时及时更新
3. **完整验证**: 确保所有测试用例通过后再标记完成
4. **详细描述**: 提供足够详细的修改说明
5. **建议具体化**: 提出可操作的改进建议