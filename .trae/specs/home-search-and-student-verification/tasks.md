# 首页搜索和学生认证功能 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 扩展数据库User模型
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在User模型中添加school字段（string类型，允许为空）
  - 在User模型中添加major字段（string类型，允许为空）
  - 确保数据库迁移支持新增字段
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `programmatic` TR-1.1: 检查User.js模型文件包含school和major字段定义
  - `programmatic` TR-1.2: 验证字段类型和nullable设置正确
- **Notes**: 使用Sequelize添加新字段，确保不影响现有数据

## [x] Task 2: 后端注册API支持学校和专业
- **Priority**: P0
- **Depends On**: [Task 1]
- **Description**: 
  - 修改auth路由的注册接口，接收school和major参数
  - 更新User.create调用，保存school和major信息
  - 确保登录时返回用户信息包含school和major字段
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `programmatic` TR-2.1: 检查注册接口接收school和major参数
  - `programmatic` TR-2.2: 检查用户信息API返回school和major字段
- **Notes**: 学校和专业为选填字段

## [x] Task 3: 首页搜索功能实现
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改首页搜索框，移除disabled属性
  - 添加搜索输入响应，支持实时搜索或回车搜索
  - 显示搜索结果列表（复用现有item-card组件）
  - 搜索时显示加载状态
- **Acceptance Criteria Addressed**: [AC-1, AC-6]
- **Test Requirements**:
  - `human-judgement` TR-3.1: 首页搜索框可输入并触发搜索
  - `human-judgement` TR-3.2: 搜索结果正确显示
  - `human-judgement` TR-3.3: 加载状态显示正常
- **Notes**: 复用现有的getItemList API，后端已支持keyword参数

## [x] Task 4: 创建高校列表数据
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 创建高校列表文件（包含常见高校名称）
  - 提供搜索匹配逻辑（模糊匹配）
  - 数据放在前端utils或constants中
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 高校列表包含足够多的学校
  - `human-judgement` TR-4.2: 搜索匹配逻辑正常工作
- **Notes**: 可以先添加50-100所常见高校

## [x] Task 5: 注册页面学校和专业输入
- **Priority**: P1
- **Depends On**: [Task 4]
- **Description**: 
  - 在注册页面添加学校输入框（带下拉选择）
  - 添加专业输入框（普通输入框）
  - 实现学校搜索功能，300ms防抖
  - 学校下拉菜单显示匹配结果
  - 将学校和专业数据传递给注册API
- **Acceptance Criteria Addressed**: [AC-3, AC-6]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 学校输入框有搜索和下拉选择
  - `human-judgement` TR-5.2: 防抖功能正常工作
  - `human-judgement` TR-5.3: 专业输入框可正常输入
  - `human-judgement` TR-5.4: 注册成功后信息保存
- **Notes**: 使用VueUse的useDebounceFn或自己实现防抖

## [x] Task 6: 个人中心认证状态显示
- **Priority**: P1
- **Depends On**: [Task 2]
- **Description**: 
  - 在个人中心信用分旁添加认证状态标签
  - 已认证显示绿色标签，未认证显示灰色标签
  - 点击未认证状态可以跳转到认证页面（暂留接口）
  - 若用户填写了学校信息，在个人中心展示
- **Acceptance Criteria Addressed**: [AC-2, AC-5, AC-6]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 认证状态标签显示正确
  - `human-judgement` TR-6.2: 学校和专业信息显示（如果有）
  - `human-judgement` TR-6.3: 点击未认证状态有响应
- **Notes**: 认证状态从userInfo.isVerified获取

## [x] Task 7: 启动并测试完整功能
- **Priority**: P0
- **Depends On**: [Task 3, Task 5, Task 6]
- **Description**: 
  - 启动数据库和后端项目
  - 启动前端项目
  - 逐项测试每个功能
  - 检查浏览器控制台错误
  - 修复发现的bug
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `programmatic` TR-7.1: 后端服务正常启动在3000端口
  - `programmatic` TR-7.2: 前端服务正常启动
  - `programmatic` TR-7.3: 浏览器无JavaScript错误
  - `human-judgement` TR-7.4: 所有功能正常工作
- **Notes**: 每完成一个功能都要进行测试

# Task Dependencies
- Task 2 depends on Task 1
- Task 5 depends on Task 4
- Task 6 depends on Task 2
- Task 7 depends on Task 3, Task 5, Task 6
