# 发布界面优化 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 更新后端数据模型 (Item.js)
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在Item模型中添加transactionType字段（ENUM: 'free', 'rent', 'sell'，默认值'rent'）
  - 添加salePrice字段（DECIMAL(10,2)，允许为null）
  - 更新comment说明
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-1.1: Item模型包含transactionType字段，类型为ENUM，默认值'rent'
  - `programmatic` TR-1.2: Item模型包含salePrice字段，类型为DECIMAL(10,2)
  - `human-judgement` TR-1.3: 代码风格与现有模型保持一致
- **Notes**: 确保向后兼容，现有数据不受影响

## [x] Task 2: 创建数据库迁移脚本
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建迁移脚本，为现有items表添加新字段
  - transactionType默认值设为'rent'
  - 提供回滚脚本
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-2.1: 执行迁移后，items表包含新字段
  - `programmatic` TR-2.2: 现有数据的transactionType为'rent'
  - `human-judgement` TR-2.3: 迁移脚本可安全执行和回滚
- **Notes**: 迁移前建议备份数据

## [x] Task 3: 更新后端API路由 (items.js)
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 更新POST /items接口，支持transactionType和salePrice参数
  - 更新PUT /items/:id接口，支持更新新字段
  - 确保参数验证正确
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `programmatic` TR-3.1: POST /items接收并保存transactionType
  - `programmatic` TR-3.2: POST /items接收并保存salePrice
  - `programmatic` TR-3.3: PUT /items/:id可更新transactionType
  - `human-judgement` TR-3.4: 代码风格与现有路由保持一致
- **Notes**: 保持现有API的向后兼容性

## [x] Task 4: 更新前端类型定义 (types.ts)
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在Item接口中添加transactionType字段
  - 在Item接口中添加salePrice字段
  - 更新CreateItemParams接口
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-4.1: TypeScript编译无错误
  - `human-judgement` TR-4.2: 类型定义清晰完整
- **Notes**: 确保类型安全

## [x] Task 5: 更新前端API调用 (items.ts)
- **Priority**: P0
- **Depends On**: Task 4
- **Description**: 
  - 更新CreateItemParams接口，添加新字段
  - 确保API调用传递正确的参数
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `programmatic` TR-5.1: CreateItemParams包含transactionType
  - `programmatic` TR-5.2: CreateItemParams包含salePrice
  - `human-judgement` TR-5.3: 代码风格一致
- **Notes**: 保持现有API调用的功能

## [x] Task 6-9: 重构前端发布页面 - 完整功能
- **Priority**: P0
- **Depends On**: Task 5
- **Description**: 
  - 在表单顶部添加交易方式单选组件
  - 默认选中"租用"
  - 添加transactionType到form数据
  - 添加salePrice到form数据
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement` TR-6.1: 显示三个单选按钮：免费、租用（选中）、转卖
  - `human-judgement` TR-6.2: 单选按钮样式美观，与整体风格一致
  - `programmatic` TR-6.3: form数据包含transactionType和salePrice
- **Notes**: 使用uni-app的radio组件或自定义实现

## [ ] Task 7: 重构前端发布页面 - 动态表单字段
- **Priority**: P0
- **Depends On**: Task 6
- **Description**: 
  - 根据transactionType动态显示/隐藏字段
  - 免费：隐藏租金、押金、可租时间
  - 租用：显示所有字段
  - 转卖：显示售价，隐藏押金、可租时间
  - 更新表单验证逻辑
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-4
- **Test Requirements**:
  - `human-judgement` TR-7.1: 选择免费时，只显示必要字段
  - `human-judgement` TR-7.2: 选择租用（默认）时，显示完整表单
  - `human-judgement` TR-7.3: 选择转卖时，显示售价，隐藏押金和可租时间
  - `programmatic` TR-7.4: 表单验证根据交易方式正确验证必填字段
- **Notes**: 保持良好的用户体验

## [ ] Task 8: 重构前端发布页面 - 长期租用功能
- **Priority**: P0
- **Depends On**: Task 7
- **Description**: 
  - 在租用模式下添加"长期租用"开关
  - 开启时隐藏结束时间选择
  - 更新availableTime数据结构
  - 更新表单验证逻辑
- **Acceptance Criteria Addressed**: AC-5, AC-6
- **Test Requirements**:
  - `human-judgement` TR-8.1: 租用模式下显示"长期租用"开关
  - `human-judgement` TR-8.2: 开启开关时，结束时间区域隐藏
  - `human-judgement` TR-8.3: 关闭开关时，结束时间区域显示
  - `programmatic` TR-8.4: 表单验证正确处理长期租用（不要求结束时间）
- **Notes**: 开关样式与整体风格一致

## [ ] Task 9: 编辑模式回显功能
- **Priority**: P0
- **Depends On**: Task 8
- **Description**: 
  - 在loadItemDetail中加载transactionType
  - 在loadItemDetail中加载salePrice
  - 根据transactionType正确显示表单字段
  - 正确回显长期租用状态
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `human-judgement` TR-9.1: 编辑现有物品时，正确显示交易方式
  - `human-judgement` TR-9.2: 根据交易方式显示/隐藏对应字段
  - `programmatic` TR-9.3: salePrice正确回显
  - `human-judgement` TR-9.4: 长期租用状态正确回显
- **Notes**: 确保编辑功能完全正常

## [x] Task 10: 集成测试和端到端验证
- **Priority**: P1
- **Depends On**: Task 2, Task 9
- **Description**: 
  - 测试创建免费物品
  - 测试创建租用物品（含长期租用）
  - 测试创建转卖物品
  - 测试编辑不同类型的物品
  - 验证数据库数据正确保存
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-10
- **Test Requirements**:
  - `programmatic` TR-10.1: 三种交易方式的物品都能成功创建
  - `programmatic` TR-10.2: 长期租用物品的availableTime.end为null/undefined
  - `programmatic` TR-10.3: 数据库数据正确保存
  - `human-judgement` TR-10.4: 用户体验流畅，无bug
- **Notes**: 充分测试各种边界情况
