/**
 * 模拟数据初始化脚本
 * 创建用户、物品、订单、消息、评价、纠纷等模拟数据
 */
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User, Item, Order, Message, Review, Dispute, CreditRecord, UserRestriction, AdminActionLog } = require('../models');

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];
const createOrderNo = () => `ORD${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const createCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const initMockData = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await AdminActionLog.destroy({ where: {} });
    await UserRestriction.destroy({ where: {} });
    await CreditRecord.destroy({ where: {} });
    await Dispute.destroy({ where: {} });
    await Review.destroy({ where: {} });
    await Message.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Item.destroy({ where: {} });
    await User.destroy({ where: {} });
    console.log('旧数据已清理');

    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = {};
    const userDefinitions = [
      { key: 'root', username: 'root', role: 'super_admin', isVerified: true, creditScore: 100 },
      { key: 'admin', username: 'admin', role: 'admin', isVerified: true, creditScore: 100 },
      { key: 'buyer', username: 'buyer', role: 'user', studentId: '202214060423', phone: '13800000002', qq: '1234568', isVerified: true, creditScore: 100 },
      { key: 'seller', username: 'seller', role: 'user', studentId: '202214060424', phone: '13800000003', qq: '1234569', isVerified: true, creditScore: 100 },
      { key: 'lowcredit', username: 'lowcredit', role: 'user', studentId: '202214060425', phone: '13800000004', qq: '1234570', isVerified: true, creditScore: 55, isViolationUser: true, violationMarkedAt: new Date(), violationReason: '初始化低信誉测试账号' },
      { key: 'user', username: 'user', role: 'user', studentId: '202214060422', phone: '13800000001', qq: '1234567', isVerified: false, creditScore: 100 },
      { key: 'zhangsan', username: 'zhangsan', role: 'user', studentId: '202214060101', phone: '13800000011', qq: '2234567', isVerified: true, creditScore: 92 },
      { key: 'lisi', username: 'lisi', role: 'user', studentId: '202214060102', phone: '13800000012', qq: '2234568', isVerified: true, creditScore: 88 }
    ];

    for (const definition of userDefinitions) {
      users[definition.key] = await User.create({
        username: definition.username,
        studentId: definition.studentId || null,
        phone: definition.phone || null,
        qq: definition.qq || null,
        password: hashedPassword,
        role: definition.role,
        creditScore: definition.creditScore,
        isVerified: definition.isVerified,
        status: 'active',
        isViolationUser: definition.isViolationUser || false,
        violationMarkedAt: definition.violationMarkedAt || null,
        violationReason: definition.violationReason || null,
        deletionStatus: 'none'
      });
      console.log(`  创建用户: ${definition.username} (${definition.role})`);
    }

    const itemDefinitions = [
      { key: 'camera', title: '佳能单反相机 EOS 200D', category: '电子产品', price: 50, deposit: 2000, description: '入门款单反，适合摄影新手', userKey: 'seller', location: '图书馆', status: 'reserved', transactionType: 'rent' },
      { key: 'ipad', title: 'iPad Air 4 64G', category: '电子产品', price: 30, deposit: 3000, description: '学习办公利器', userKey: 'seller', location: '教学楼', status: 'rented', transactionType: 'rent' },
      { key: 'keyboard', title: '罗技机械键盘 K845', category: '电子产品', price: 10, deposit: 300, description: '青轴机械键盘', userKey: 'zhangsan', location: '东区宿舍', status: 'available', transactionType: 'sell' },
      { key: 'book', title: '高等数学（同济第七版）', category: '图书教材', price: 3, deposit: 50, description: '高等数学教材', userKey: 'lisi', location: '西区宿舍', status: 'available', transactionType: 'rent' }
    ];

    const items = {};
    for (const itemDefinition of itemDefinitions) {
      items[itemDefinition.key] = await Item.create({
        title: itemDefinition.title,
        category: itemDefinition.category,
        price: itemDefinition.price,
        deposit: itemDefinition.deposit,
        description: itemDefinition.description,
        userId: users[itemDefinition.userKey].id,
        images: ['/static/logo.png'],
        location: itemDefinition.location,
        status: itemDefinition.status,
        transactionType: itemDefinition.transactionType,
        availableTime: {}
      });
      console.log(`  创建物品: ${itemDefinition.title}`);
    }

    const now = new Date();
    const confirmedStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const confirmedEnd = new Date(confirmedStart.getTime() + 2 * 24 * 60 * 60 * 1000);
    const usingStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const usingEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const completedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const completedEnd = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const orders = {};

    orders.confirmed = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.camera.id,
      lenderId: users.seller.id,
      borrowerId: users.buyer.id,
      startDate: confirmedStart,
      endDate: confirmedEnd,
      totalDays: 2,
      totalPrice: 100,
      deposit: 2000,
      note: 'MCP 纠纷测试订单',
      pickupLocation: '图书馆门口',
      returnLocation: '图书馆门口',
      status: 'confirmed',
      pickupCode: createCode(),
      returnCode: createCode(),
      pendingConfirmation: false,
      pendingExtension: false,
      cancelReason: null
    });

    orders.using = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.ipad.id,
      lenderId: users.seller.id,
      borrowerId: users.user.id,
      startDate: usingStart,
      endDate: usingEnd,
      totalDays: 4,
      totalPrice: 120,
      deposit: 3000,
      note: '使用中订单',
      pickupLocation: '教学楼 A 座',
      returnLocation: '教学楼 A 座',
      status: 'using',
      pickupCode: createCode(),
      returnCode: createCode(),
      pickupCodeVerifiedAt: new Date(usingStart.getTime() - 60 * 60 * 1000),
      pickupConfirmedByLenderAt: usingStart,
      actualPickupTime: usingStart,
      pendingConfirmation: false,
      pendingExtension: false
    });

    orders.completed = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.book.id,
      lenderId: users.lisi.id,
      borrowerId: users.zhangsan.id,
      startDate: completedStart,
      endDate: completedEnd,
      totalDays: 2,
      totalPrice: 6,
      deposit: 50,
      note: '已完成评价订单',
      pickupLocation: '西区宿舍楼下',
      returnLocation: '西区宿舍楼下',
      status: 'completed',
      pickupCode: createCode(),
      returnCode: createCode(),
      pickupCodeVerifiedAt: new Date(completedStart.getTime() - 60 * 60 * 1000),
      pickupConfirmedByLenderAt: completedStart,
      actualPickupTime: completedStart,
      returnCodeVerifiedAt: new Date(completedEnd.getTime() - 60 * 60 * 1000),
      returnConfirmedByLenderAt: completedEnd,
      actualReturnTime: completedEnd,
      returnConfirmedTime: completedEnd,
      pendingConfirmation: false,
      pendingExtension: false
    });

    console.log('  创建了 confirmed / using / completed 测试订单');

    await Message.bulkCreate([
      {
        senderId: null,
        receiverId: users.seller.id,
        itemId: items.camera.id,
        content: 'buyer 已发起交易，请确认订单信息。',
        type: 'system',
        relatedId: orders.confirmed.id,
        relatedType: 'order',
        isRead: false
      },
      {
        senderId: null,
        receiverId: users.buyer.id,
        itemId: items.camera.id,
        content: 'seller 已确认交易，订单已进入待交接。',
        type: 'system',
        relatedId: orders.confirmed.id,
        relatedType: 'order',
        isRead: false
      }
    ]);

    await Review.bulkCreate([
      {
        orderId: orders.completed.id,
        reviewerId: users.zhangsan.id,
        revieweeId: users.lisi.id,
        rating: 5,
        content: '沟通顺畅，物品完好'
      },
      {
        orderId: orders.completed.id,
        reviewerId: users.lisi.id,
        revieweeId: users.zhangsan.id,
        rating: 4,
        content: '按时归还，体验不错'
      }
    ]);

    const dispute = await Dispute.create({
      orderId: orders.confirmed.id,
      itemId: items.camera.id,
      borrowerId: users.buyer.id,
      lenderId: users.seller.id,
      initiatorId: users.buyer.id,
      respondentId: users.seller.id,
      status: 'awaiting_counterparty',
      initiatorStatement: '卖方临时变更交接地点，影响正常取货，希望管理员介入。',
      initiatorImages: ['/static/logo.png']
    });

    console.log(`  创建纠纷: #${dispute.id}`);

    console.log('\n✅ 模拟数据初始化完成！');
    console.log('测试账号：');
    console.log('  root / 123456');
    console.log('  admin / 123456');
    console.log('  buyer / 123456');
    console.log('  seller / 123456');
    console.log('  lowcredit / 123456');
    console.log(`纠纷测试订单ID: ${orders.confirmed.id}`);

    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
};

initMockData();
