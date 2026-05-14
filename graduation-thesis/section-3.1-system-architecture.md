## 3.1 系统架构

本系统采用前后端分离架构进行开发。前端基于 uni-app 框架实现，使用 Vue 3、TypeScript 和 Pinia 完成页面展示、状态管理与交互逻辑，可面向 H5 和小程序等终端运行；后端基于 Node.js 和 Express 构建 RESTful API，为前端提供统一的数据访问接口。系统整体架构如图 3.1 所示。

在后端实现中，系统按照“路由层、业务层、数据访问层”进行划分。路由层负责请求分发与参数接收，业务层负责用户认证、物品发布、订单流转、消息通知、纠纷处理和后台管理等核心逻辑，数据访问层通过 Sequelize ORM 与 MySQL 数据库进行交互。同时，系统结合 JWT 完成身份认证，借助 Multer 实现图片上传，并通过定时任务完成订单提醒等功能。

系统数据流如图 3.2 所示。用户在前端发起注册登录、物品浏览、订单提交和消息查看等操作后，请求经由 HTTP 发送至后端接口；后端完成鉴权、业务处理和数据读写后，将结果返回前端展示。对于图片资源、系统消息和订单提醒等内容，系统也统一由服务端生成或管理，从而保证平台业务流程的完整性与一致性。

图 3.1 系统架构图见 [system-architecture.png](/c:/Users/liyiwen/Desktop/work/newpc/graduation-thesis/figures/system-architecture.png:1)。  
图 3.2 系统数据流图见 [data-flow.png](/c:/Users/liyiwen/Desktop/work/newpc/graduation-thesis/figures/data-flow.png:1)。
