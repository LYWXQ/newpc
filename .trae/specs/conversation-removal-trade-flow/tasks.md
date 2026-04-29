# 对话功能删除与交易流程完善 - 实施计划

## [x] Task 1: 更新User表添加QQ字段
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在User表中添加qq字段存储用户QQ号
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-1.1: User表包含qq字段
  - `human-judgment` TR-1.2: 用户注册/编辑资料页面可填写QQ号
- **Notes**: 需要创建数据库迁移脚本

## [x] Task 2: 更新Order表添加地点字段
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 添加pickupLocation（取货地点）和returnLocation（还货地点）字段
- **Acceptance Criteria Addressed**: AC-3, AC-4, AC-7
- **Test Requirements**:
  - `programmatic` TR-2.1: Order表包含pickupLocation和returnLocation字段
- **Notes**: 需要创建数据库迁移脚本

## [x] Task 3: 删除前端聊天页面
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 删除 chat 页面目录
  - 删除 messages 页面中的聊天会话列表
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgment` TR-3.1: 聊天页面不可访问
  - `human-judgment` TR-3.2: 消息页面只显示系统消息
- **Notes**: 保留系统消息展示

## [x] Task 4: 更新物品详情页显示联系方式
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在物品详情页显示发布者的QQ和电话号码
  - 添加一键复制功能
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgment` TR-4.1: 物品详情页显示QQ和手机号
  - `human-judgment` TR-4.2: 点击号码可复制到剪贴板
- **Notes**: 需要更新API返回发布者联系方式

## [x] Task 5: 删除后端聊天API接口
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 删除 messages.js 中的聊天相关接口（保留系统消息相关）
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-5.1: 聊天相关API接口已删除
- **Notes**: 保留系统消息发送功能用于交易提醒

## [x] Task 6: 实现交易请求功能
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 买方发起交易请求（选择时间和地点）
  - 卖方收到系统消息通知
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgment` TR-6.1: 可发起交易请求
  - `human-judgment` TR-6.2: 卖方收到系统消息通知
- **Notes**: 需要更新订单创建逻辑

## [x] Task 7: 实现卖方确认/修改功能
- **Priority**: P0
- **Depends On**: Task 6
- **Description**: 
  - 卖方确认请求或修改时间地点
  - 时间地点变更时通知买方确认
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgment` TR-7.1: 可确认或修改交易信息
  - `human-judgment` TR-7.2: 修改后买方收到确认通知
- **Notes**: 需要添加订单状态流转

## [x] Task 8: 实现物品交接功能
- **Priority**: P0
- **Depends On**: Task 7
- **Description**: 
  - 生成取件码
  - 输入取件码完成交接
  - 订单状态变为"使用中"
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `human-judgment` TR-8.1: 系统生成取件码
  - `human-judgment` TR-8.2: 输入取件码完成交接
- **Notes**: 需要更新订单状态

## [x] Task 9: 实现临期提醒功能
- **Priority**: P1
- **Depends On**: Task 8
- **Description**: 
  - 租借物品到期前24小时发送系统消息提醒
  - 提醒双方确认归还时间地点
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgment` TR-9.1: 到期前24小时收到提醒消息
  - `human-judgment` TR-9.2: 可确认或修改归还信息
- **Notes**: 需要添加定时任务或触发器

## [x] Task 10: 实现归还完成功能
- **Priority**: P0
- **Depends On**: Task 8, Task 9
- **Description**: 
  - 确认归还完成
  - 订单状态变为"已完成"
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `human-judgment` TR-10.1: 可确认归还完成
  - `human-judgment` TR-10.2: 订单状态更新为已完成
- **Notes**: 需要处理押金退还逻辑

## [x] Task 11: 实现信誉分机制
- **Priority**: P1
- **Depends On**: Task 10
- **Description**: 
  - 按时归还增加信誉分
  - 逾期未归还扣除信誉分
  - 取消订单影响信誉分
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `programmatic` TR-11.1: 信誉分计算逻辑正确
  - `human-judgment` TR-11.2: 用户信誉分显示正确
- **Notes**: 需要定义信誉分规则

## [x] Task 12: 更新页面路由配置
- **Priority**: P1
- **Depends On**: Task 3
- **Description**: 
  - 更新pages.json移除聊天页面路由
  - 更新tabBar配置（如需要）
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgment` TR-12.1: 聊天页面路由已移除
- **Notes**: 需要检查路由配置

## [x] Task 13: 更新前端订单页面
- **Priority**: P1
- **Depends On**: Task 6-11
- **Description**: 
  - 更新订单页面显示完整交易流程
  - 添加交易操作按钮
- **Acceptance Criteria Addressed**: AC-3-AC-8
- **Test Requirements**:
  - `human-judgment` TR-13.1: 订单页面显示完整交易信息
  - `human-judgment` TR-13.2: 可执行交易操作
- **Notes**: 需要更新订单详情页面