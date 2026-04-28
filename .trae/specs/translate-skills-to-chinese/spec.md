# Skills 翻译为中文规范

## Why
当前项目中的skills（如vue、pinia、vite、uniapp等）的SKILL.md文件和references目录中的文档都是英文的。为了让中文用户更容易理解和使用这些技能，需要将所有英文内容翻译成中文，并确保每个技能都有明确的调用场景描述。

## What Changes
- 将所有skills的SKILL.md文件从英文翻译成中文
- 将所有references目录中的.md文件从英文翻译成中文
- 检查并完善每个技能的description字段，确保包含明确的调用场景
- 确保所有技能都能在对应场景下被正确调用

## Impact
- Affected specs: 所有位于 `.trae/skills/` 目录下的技能
- Affected code: SKILL.md, references/*.md, GENERATION.md, SYNC.md等

## ADDED Requirements
### Requirement: 技能文档翻译
The system SHALL provide 完整的中文技能文档

#### Scenario: 用户查看技能文档
- **WHEN** 用户查看任意技能的SKILL.md
- **THEN** 所有内容应该为中文
- **AND** description字段应该清晰描述调用场景

#### Scenario: 用户查看references文档
- **WHEN** 用户查看references目录下的任意.md文件
- **THEN** 所有内容应该为中文

### Requirement: 调用场景描述
The system SHALL ensure 每个技能都有明确的调用场景

#### Scenario: 技能被触发
- **WHEN** 用户进行特定开发任务
- **THEN** 对应的技能应该被自动调用
- **AND** description字段应该清晰说明何时调用

## MODIFIED Requirements
### Requirement: 技能文件结构
所有技能文件保持原有结构，仅内容翻译为中文

## REMOVED Requirements
无
