# Tasks

- [ ] Task 1: 创建后端 Favorite 数据模型
  - [ ] SubTask 1.1: 创建 backend/models/Favorite.js 模型文件
  - [ ] SubTask 1.2: 更新 backend/models/index.js 添加 Favorite 关联关系
  - [ ] SubTask 1.3: 重启后端服务，验证数据库表创建成功

- [ ] Task 2: 创建后端收藏 API 接口
  - [ ] SubTask 2.1: 创建 backend/controllers/favoriteController.js 控制器
  - [ ] SubTask 2.2: 创建 backend/routes/favorites.js 路由文件
  - [ ] SubTask 2.3: 更新 backend/app.js 注册收藏路由
  - [ ] SubTask 2.4: 测试所有 API 接口正常工作

- [ ] Task 3: 创建前端收藏 API 模块
  - [ ] SubTask 3.1: 创建 frontend/src/api/favorites.ts API 模块
  - [ ] SubTask 3.2: 定义收藏相关的 TypeScript 类型接口

- [ ] Task 4: 修改物品详情页按钮
  - [ ] SubTask 4.1: 修改 item-detail.vue 底部按钮布局（收藏 + 联系发布者）
  - [ ] SubTask 4.2: 添加收藏状态检查和切换逻辑
  - [ ] SubTask 4.3: 设置按钮样式（收藏-黄色，联系发布者-蓝色）
  - [ ] SubTask 4.4: 测试收藏/取消收藏功能

- [ ] Task 5: 个人中心添加收藏入口
  - [ ] SubTask 5.1: 修改 profile.vue 在"我的评价"下方添加"我的收藏"菜单
  - [ ] SubTask 5.2: 添加收藏数量显示
  - [ ] SubTask 5.3: 实现跳转到收藏页面

- [ ] Task 6: 创建我的收藏页面
  - [ ] SubTask 6.1: 创建 frontend/src/pages/favorites/favorites.vue 页面
  - [ ] SubTask 6.2: 实现收藏列表展示（图片、名称、价格）
  - [ ] SubTask 6.3: 实现单个取消收藏功能（带确认对话框）
  - [ ] SubTask 6.4: 实现点击进入物品详情
  - [ ] SubTask 6.5: 实现批量管理功能（选择模式、批量取消收藏）

- [ ] Task 7: 注册收藏页面路由
  - [ ] SubTask 7.1: 更新 pages.json 添加 favorites 页面配置
  - [ ] SubTask 7.2: 测试页面导航正常

- [ ] Task 8: 功能验证测试
  - [ ] SubTask 8.1: 完整测试收藏流程（收藏 -> 查看列表 -> 取消收藏）
  - [ ] SubTask 8.2: 测试批量操作功能
  - [ ] SubTask 8.3: 验证所有边界情况处理

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 3
- Task 6 depends on Task 3
- Task 7 depends on Task 6
- Task 8 depends on Task 4, Task 5, Task 7
