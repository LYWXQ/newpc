/**
 * 模拟数据初始化脚本
 * 创建用户、物品、订单、消息等模拟数据
 */
const sequelize = require('../config/database');
const { User, Item, Order, Message, Review } = require('../models');
const bcrypt = require('bcryptjs');

const initMockData = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 清空现有数据（保留root、admin、user三个基础用户）
    await Review.destroy({ where: {} });
    await Message.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Item.destroy({ where: {} });
    await User.destroy({ 
      where: { 
        role: 'user',
        username: { [require('sequelize').Op.notIn]: ['user', 'root', 'admin'] }
      }
    });
    console.log('旧数据已清理');

    const hashedPassword = await bcrypt.hash('123456', 10);

    // ========== 1. 创建更多用户 ==========
    console.log('创建用户...');
    const users = [];
    
    // 普通用户
    const normalUsers = [
      { username: 'zhangsan', studentId: '202214060101' },
      { username: 'lisi', studentId: '202214060102' },
      { username: 'wangwu', studentId: '202214060103' },
      { username: 'zhaoliu', studentId: '202214060104' },
      { username: 'qianqi', studentId: '202214060105' },
      { username: 'sunba', studentId: '202214060106' },
      { username: 'zhoujiu', studentId: '202214060107' },
      { username: 'wushi', studentId: '202214060108' }
    ];

    for (const u of normalUsers) {
      const user = await User.create({
        username: u.username,
        studentId: u.studentId,
        password: hashedPassword,
        creditScore: Math.floor(Math.random() * 30) + 70, // 70-100分
        isVerified: Math.random() > 0.3,
        role: 'user',
        status: 'active',
        avatar: null
      });
      users.push(user);
      console.log(`  创建用户: ${u.username} (学号: ${u.studentId})`);
    }

    // 加上原有的user
    const existingUser = await User.findOne({ where: { username: 'user' } });
    if (existingUser) {
      users.push(existingUser);
    }

    // ========== 2. 创建物品 ==========
    console.log('创建物品...');
    const categories = ['电子产品', '图书教材', '运动器材', '生活用品', '服装配饰', '乐器', '工具设备'];
    
    const itemsData = [
      // 电子产品
      { title: '佳能单反相机 EOS 200D', category: '电子产品', price: 50, deposit: 2000, description: '入门款单反，适合摄影新手，配18-55mm镜头' },
      { title: '索尼降噪耳机 WH-1000XM4', category: '电子产品', price: 20, deposit: 1500, description: '顶级降噪，音质出色，续航30小时' },
      { title: 'iPad Air 4 64G', category: '电子产品', price: 30, deposit: 3000, description: '学习办公利器，配Apple Pencil' },
      { title: '小米充电宝 20000mAh', category: '电子产品', price: 5, deposit: 100, description: '大容量，可带上飞机' },
      { title: '罗技机械键盘 K845', category: '电子产品', price: 10, deposit: 300, description: '青轴，打字手感好，RGB背光' },
      
      // 图书教材
      { title: '高等数学（同济第七版）', category: '图书教材', price: 3, deposit: 50, description: '高等数学教材，笔记详细' },
      { title: '考研英语词汇红宝书', category: '图书教材', price: 2, deposit: 40, description: '考研必备，词汇全面' },
      { title: 'C++ Primer Plus', category: '图书教材', price: 4, deposit: 80, description: '编程经典，适合初学者' },
      { title: '线性代数（清华版）', category: '图书教材', price: 3, deposit: 50, description: '清华教材，例题丰富' },
      
      // 运动器材
      { title: '尤尼克斯羽毛球拍', category: '运动器材', price: 15, deposit: 500, description: '专业级球拍，已穿线' },
      { title: '斯伯丁篮球', category: '运动器材', price: 8, deposit: 200, description: '室内室外通用，手感好' },
      { title: '瑜伽垫', category: '运动器材', price: 5, deposit: 100, description: '加厚防滑，送瑜伽带' },
      { title: '哑铃套装 20kg', category: '运动器材', price: 10, deposit: 300, description: '可调节重量，适合宿舍健身' },
      
      // 生活用品
      { title: '台灯 LED护眼', category: '生活用品', price: 5, deposit: 100, description: '三档调光，USB充电' },
      { title: '收纳箱 大号', category: '生活用品', price: 3, deposit: 50, description: '透明可视，带轮子' },
      { title: '吹风机 负离子', category: '生活用品', price: 5, deposit: 100, description: '恒温护发，功率大' },
      { title: '挂烫机 便携', category: '生活用品', price: 8, deposit: 150, description: '快速出蒸汽，适合面试' },
      
      // 服装配饰
      { title: '西装套装 175/L', category: '服装配饰', price: 30, deposit: 500, description: '面试正装，修身版型' },
      { title: '汉服 齐胸襦裙', category: '服装配饰', price: 40, deposit: 600, description: '古风摄影，含配饰' },
      { title: '演出礼服', category: '服装配饰', price: 50, deposit: 800, description: '晚会主持，优雅大方' },
      
      // 乐器
      { title: '吉他 民谣41寸', category: '乐器', price: 15, deposit: 400, description: '单板吉他，音色好，送琴包' },
      { title: '尤克里里 23寸', category: '乐器', price: 10, deposit: 250, description: '入门款，简单易上手' },
      { title: '口琴 24孔', category: '乐器', price: 5, deposit: 80, description: 'C调，适合初学者' },
      
      // 工具设备
      { title: '电钻套装', category: '工具设备', price: 15, deposit: 300, description: '家用多功能，配多种钻头' },
      { title: '梯子 折叠', category: '工具设备', price: 10, deposit: 200, description: '四步梯，承重150kg' },
      { title: '投影仪 便携', category: '工具设备', price: 40, deposit: 1500, description: '高清投影，适合宿舍影院' }
    ];

    const items = [];
    for (const itemData of itemsData) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const item = await Item.create({
        ...itemData,
        userId: randomUser.id,
        images: ['/static/logo.png'], // 使用默认图片
        location: ['东区宿舍', '西区宿舍', '图书馆', '教学楼'][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.2 ? 'available' : 'rented',
        viewCount: Math.floor(Math.random() * 100)
      });
      items.push(item);
      console.log(`  创建物品: ${itemData.title}`);
    }

    // ========== 3. 创建订单 ==========
    console.log('创建订单...');
    const orders = [];
    const orderStatuses = ['pending', 'confirmed', 'using', 'returned', 'completed', 'cancelled'];
    
    // 创建15个订单
    for (let i = 0; i < 15; i++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const borrower = users[Math.floor(Math.random() * users.length)];
      
      // 确保借用者不是物品所有者
      if (borrower.id === item.userId) continue;
      
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 7)); // 未来7天内
      const endTime = new Date(startTime);
      endTime.setDate(endTime.getDate() + Math.floor(Math.random() * 7) + 1); // 借用1-7天
      
      const totalDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
      const totalPrice = item.price * totalDays;
      
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      const order = await Order.create({
        orderNo: 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
        itemId: item.id,
        lenderId: item.userId,
        borrowerId: borrower.id,
        startTime,
        endTime,
        totalDays,
        totalPrice,
        deposit: item.deposit,
        remark: ['请小心使用', '希望能按时归还', '谢谢借用', ''][Math.floor(Math.random() * 4)],
        status,
        pickupCode: Math.random().toString(36).substr(2, 6).toUpperCase()
      });
      orders.push(order);
      console.log(`  创建订单: ${order.orderNo} (${status})`);
    }

    // ========== 4. 创建消息 ==========
    console.log('创建消息...');
    const messages = [
      { content: '你好，这个物品还在吗？', type: 'text' },
      { content: '在的，可以借用', type: 'text' },
      { content: '什么时候可以取？', type: 'text' },
      { content: '今天下午3点在图书馆可以吗？', type: 'text' },
      { content: '好的，没问题', type: 'text' },
      { content: '物品已经收到了，谢谢！', type: 'text' },
      { content: '不客气，记得按时归还哦', type: 'text' },
      { content: '这个相机怎么使用？', type: 'text' },
      { content: '开关在顶部，模式转盘可以选择拍摄模式', type: 'text' },
      { content: '明白了，谢谢指导！', type: 'text' }
    ];

    for (let i = 0; i < 20; i++) {
      const sender = users[Math.floor(Math.random() * users.length)];
      const receiver = users[Math.floor(Math.random() * users.length)];
      
      if (sender.id === receiver.id) continue;
      
      const msgData = messages[Math.floor(Math.random() * messages.length)];
      
      await Message.create({
        senderId: sender.id,
        receiverId: receiver.id,
        content: msgData.content,
        type: msgData.type,
        isRead: Math.random() > 0.5,
        relatedId: null,
        relatedType: null
      });
    }
    console.log('  创建了20条消息');

    // ========== 5. 创建评价 ==========
    console.log('创建评价...');
    const reviewContents = [
      '物品很新，主人很好沟通',
      '按时归还，非常守信用',
      '东西很好用，下次还会借',
      '有点磨损，但功能正常',
      '非常满意的借用体验',
      '物品干净整洁，保养得很好',
      '沟通顺畅，推荐借用',
      '比想象中好用，物超所值'
    ];

    // 为已完成的订单创建评价
    const completedOrders = orders.filter(o => o.status === 'completed');
    for (const order of completedOrders.slice(0, 5)) {
      // 借用者评价出借者
      await Review.create({
        orderId: order.id,
        reviewerId: order.borrowerId,
        revieweeId: order.lenderId,
        rating: (Math.floor(Math.random() * 2) + 4).toFixed(1), // 4-5星
        content: reviewContents[Math.floor(Math.random() * reviewContents.length)]
      });
      
      // 出借者评价借用者
      await Review.create({
        orderId: order.id,
        reviewerId: order.lenderId,
        revieweeId: order.borrowerId,
        rating: (Math.floor(Math.random() * 2) + 4).toFixed(1),
        content: reviewContents[Math.floor(Math.random() * reviewContents.length)]
      });
    }
    console.log(`  创建了${completedOrders.slice(0, 5).length * 2}条评价`);

    console.log('\n✅ 模拟数据初始化完成！');
    console.log(`统计：${users.length}个用户, ${items.length}个物品, ${orders.length}个订单`);
    
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
};

initMockData();
