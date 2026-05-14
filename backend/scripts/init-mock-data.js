/**
 * 毕设演示数据初始化脚本
 * 清空业务数据但保留表结构，保留唯一 root 超级管理员，重建真实演示数据
 */
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  User,
  Item,
  Order,
  Message,
  Review,
  Dispute,
  CreditRecord,
  UserRestriction,
  AdminActionLog,
  Favorite,
  OrderReminderLog
} = require('../models');
const { createDispute, respondToDispute, resolveDispute } = require('../services/disputeService');

const DEFAULT_PASSWORD = '123456';
const DEMO_IMAGE_BASE = '/uploads/demo-seed';

const createOrderNo = () => `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const createCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const addDays = (baseDate, days, hour = 10) => {
  const date = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  date.setHours(hour, 0, 0, 0);
  return date;
};
const toDateOnly = (date) => date.toISOString().slice(0, 10);

const ensureRootAccount = async (hashedPassword) => {
  let root = await User.findOne({ where: { username: 'root' } });

  if (!root) {
    root = await User.create({
      username: 'root',
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      creditScore: 100,
      isVerified: true,
      isViolationUser: false,
      tradeRestrictedUntil: null,
      publishRestrictedUntil: null,
      deletionStatus: 'none'
    });
  } else {
    await root.update({
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      creditScore: 100,
      isVerified: true,
      isViolationUser: false,
      violationMarkedAt: null,
      violationReason: null,
      tradeRestrictedUntil: null,
      publishRestrictedUntil: null,
      deletionStatus: 'none',
      deletionRequestedAt: null,
      deletionDeadlineAt: null,
      deletionCancelledAt: null,
      anonymizedAt: null
    });
  }

  return root;
};

const accountRows = [
  {
    role: 'super_admin',
    username: 'root',
    studentId: '-',
    phone: '-',
    qq: '-',
    note: '系统唯一超级管理员，后台管理员入口登录'
  },
  {
    role: 'admin',
    username: 'admin',
    studentId: '-',
    phone: '-',
    qq: '-',
    note: '平台管理员，后台管理员入口登录'
  },
  {
    role: 'user',
    username: 'chenxinyi',
    studentId: '202214060422',
    phone: '13800000422',
    qq: '2351406422',
    note: '软件工程专业，计算器完成订单与羽毛球拍纠纷订单的主借方'
  },
  {
    role: 'user',
    username: 'liyuze',
    studentId: '202214060421',
    phone: '13800000421',
    qq: '2351406421',
    note: '电子信息专业，相机与计算器出借方'
  },
  {
    role: 'user',
    username: 'wanghaoran',
    studentId: '202214060418',
    phone: '13800000418',
    qq: '2351406418',
    note: '人工智能专业，充电宝与投影仪出借方'
  },
  {
    role: 'user',
    username: 'zhaomengqi',
    studentId: '202214060435',
    phone: '13800000435',
    qq: '2351406435',
    note: '市场营销专业，羽毛球拍出借方、进行中订单借方'
  },
  {
    role: 'user',
    username: 'liujiawen',
    studentId: '202214060427',
    phone: '13800000427',
    qq: '2351406427',
    note: '英语专业，相机预约用户、投影仪纠纷订单借方'
  },
  {
    role: 'user',
    username: 'sunyifan',
    studentId: '202214060409',
    phone: '13800000409',
    qq: '2351406409',
    note: '金融学专业，iPad 取消订单用户'
  }
];

const initMockData = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const root = await ensureRootAccount(hashedPassword);

    await AdminActionLog.destroy({ where: {} });
    await UserRestriction.destroy({ where: {} });
    await CreditRecord.destroy({ where: {} });
    await OrderReminderLog.destroy({ where: {} });
    await Favorite.destroy({ where: {} });
    await Dispute.destroy({ where: {} });
    await Review.destroy({ where: {} });
    await Message.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Item.destroy({ where: {} });
    await User.destroy({ where: { id: { [Op.ne]: root.id } } });
    console.log('旧业务数据已清理，root 账号已保留');

    await root.update({
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      creditScore: 100,
      isVerified: true,
      isViolationUser: false,
      violationMarkedAt: null,
      violationReason: null,
      tradeRestrictedUntil: null,
      publishRestrictedUntil: null,
      deletionStatus: 'none',
      deletionRequestedAt: null,
      deletionDeadlineAt: null,
      deletionCancelledAt: null,
      anonymizedAt: null
    });

    const userDefinitions = [
      {
        key: 'admin',
        username: 'admin',
        role: 'admin',
        password: hashedPassword,
        creditScore: 100,
        isVerified: true,
        status: 'active',
        deletionStatus: 'none'
      },
      {
        key: 'chenxinyi',
        username: 'chenxinyi',
        role: 'user',
        studentId: '202214060422',
        phone: '13800000422',
        qq: '2351406422',
        school: '南昌大学',
        major: '软件工程',
        password: hashedPassword,
        creditScore: 100,
        isVerified: true,
        status: 'active',
        deletionStatus: 'none'
      },
      {
        key: 'liyuze',
        username: 'liyuze',
        role: 'user',
        studentId: '202214060421',
        phone: '13800000421',
        qq: '2351406421',
        school: '南昌大学',
        major: '电子信息工程',
        password: hashedPassword,
        creditScore: 100,
        isVerified: true,
        status: 'active',
        deletionStatus: 'none'
      },
      {
        key: 'wanghaoran',
        username: 'wanghaoran',
        role: 'user',
        studentId: '202214060418',
        phone: '13800000418',
        qq: '2351406418',
        school: '南昌大学',
        major: '人工智能',
        password: hashedPassword,
        creditScore: 100,
        isVerified: true,
        status: 'active',
        deletionStatus: 'none'
      },
      {
        key: 'zhaomengqi',
        username: 'zhaomengqi',
        role: 'user',
        studentId: '202214060435',
        phone: '13800000435',
        qq: '2351406435',
        school: '南昌大学',
        major: '市场营销',
        password: hashedPassword,
        creditScore: 100,
        isVerified: true,
        status: 'active',
        deletionStatus: 'none'
      },
      {
        key: 'liujiawen',
        username: 'liujiawen',
        role: 'user',
        studentId: '202214060427',
        phone: '13800000427',
        qq: '2351406427',
        school: '南昌大学',
        major: '英语',
        password: hashedPassword,
        creditScore: 96,
        isVerified: true,
        status: 'active',
        deletionStatus: 'none'
      },
      {
        key: 'sunyifan',
        username: 'sunyifan',
        role: 'user',
        studentId: '202214060409',
        phone: '13800000409',
        qq: '2351406409',
        school: '南昌大学',
        major: '金融学',
        password: hashedPassword,
        creditScore: 93,
        isVerified: true,
        status: 'active',
        deletionStatus: 'none'
      }
    ];

    const users = { root };
    for (const definition of userDefinitions) {
      users[definition.key] = await User.create(definition);
      console.log(`  创建账号: ${definition.username} (${definition.role})`);
    }

    const itemDefinitions = [
      {
        key: 'camera',
        title: '佳能 EOS 200D 单反相机',
        category: '电子产品',
        price: 38,
        deposit: 600,
        description: '机身成色良好，含 18-55mm 套机镜头、电池和充电器，适合社团活动拍摄与课程作业。',
        userKey: 'liyuze',
        location: '图书馆南门自助借还柜',
        status: 'reserved',
        transactionType: 'rent',
        images: [`${DEMO_IMAGE_BASE}/canon-eos-200d-main.jpg`],
        availableTime: { weekly: ['周一至周五 18:00 后', '周末全天'] }
      },
      {
        key: 'ipad',
        title: 'iPad Air 平板电脑',
        category: '电子产品',
        price: 26,
        deposit: 500,
        description: '64G Wi‑Fi 版本，适合课堂展示、手写笔记和轻办公。',
        userKey: 'wanghaoran',
        location: '信息楼一层大厅',
        status: 'available',
        transactionType: 'rent',
        images: [`${DEMO_IMAGE_BASE}/ipad-air-main.jpg`],
        availableTime: { weekly: ['工作日 12:00-13:30', '周末全天'] }
      },
      {
        key: 'calculator',
        title: '卡西欧 fx-991EX 科学计算器',
        category: '学习用品',
        price: 4,
        deposit: 40,
        description: '支持矩阵、统计与方程运算，考试周可短租。',
        userKey: 'liyuze',
        location: '理工楼 B 座值班台',
        status: 'available',
        transactionType: 'rent',
        images: [`${DEMO_IMAGE_BASE}/casio-fx-991ex-main.jpg`],
        availableTime: { weekly: ['周一至周日 08:00-22:00'] }
      },
      {
        key: 'keyboard',
        title: '罗技机械键盘',
        category: '电子产品',
        price: 8,
        deposit: 120,
        description: '机械轴体手感清脆，适合宿舍临时替换或比赛训练。',
        userKey: 'wanghaoran',
        location: '北区宿舍 7 栋',
        status: 'available',
        transactionType: 'rent',
        images: [`${DEMO_IMAGE_BASE}/logitech-keyboard-main.jpg`],
        availableTime: { weekly: ['每日 18:00 后'] }
      },
      {
        key: 'powerbank',
        title: '小米 10000mAh 充电宝',
        category: '电子产品',
        price: 3,
        deposit: 30,
        description: '附带 Type‑C 线，适合外出或图书馆临时补电。',
        userKey: 'wanghaoran',
        location: '信息楼 207 实验室门口',
        status: 'rented',
        transactionType: 'rent',
        images: [`${DEMO_IMAGE_BASE}/xiaomi-powerbank-main.jpg`],
        availableTime: { weekly: ['工作日全天'] }
      },
      {
        key: 'racket',
        title: '尤尼克斯 Nanoray 10 羽毛球拍',
        category: '运动户外',
        price: 6,
        deposit: 80,
        description: '轻量入门拍，附拍套，适合体育课与晚间球馆练习。',
        userKey: 'zhaomengqi',
        location: '体育馆西侧器材寄存点',
        status: 'offline',
        transactionType: 'rent',
        images: [`${DEMO_IMAGE_BASE}/yonex-racket-main.jpg`],
        availableTime: { weekly: ['周二、周四 19:00 后', '周末全天'] }
      },
      {
        key: 'projector',
        title: '索尼便携式超短焦投影仪',
        category: '电子产品',
        price: 35,
        deposit: 700,
        description: '适合宿舍观影和小组汇报，含电源线与便携包。',
        userKey: 'wanghaoran',
        location: '创新创业中心前台',
        status: 'offline',
        transactionType: 'rent',
        images: [`${DEMO_IMAGE_BASE}/sony-projector-main.jpg`],
        availableTime: { weekly: ['提前一天预约'] }
      }
    ];

    const items = {};
    for (const definition of itemDefinitions) {
      items[definition.key] = await Item.create({
        title: definition.title,
        category: definition.category,
        price: definition.price,
        deposit: definition.deposit,
        description: definition.description,
        userId: users[definition.userKey].id,
        images: definition.images,
        location: definition.location,
        status: definition.status,
        transactionType: definition.transactionType,
        availableTime: definition.availableTime
      });
      console.log(`  创建物品: ${definition.title}`);
    }

    const now = new Date();

    const completedStart = addDays(now, -9, 9);
    const completedEnd = addDays(now, -6, 18);
    const usingStart = addDays(now, -2, 10);
    const usingEnd = addDays(now, 2, 20);
    const confirmedStart = addDays(now, 2, 15);
    const confirmedEnd = addDays(now, 4, 20);
    const cancelledStart = addDays(now, 5, 9);
    const cancelledEnd = addDays(now, 7, 18);
    const disputeStart = addDays(now, -4, 16);
    const disputeEnd = addDays(now, -1, 20);
    const resolvedStart = addDays(now, -5, 14);
    const resolvedEnd = addDays(now, -2, 21);

    const orders = {};

    orders.completedCalculator = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.calculator.id,
      lenderId: users.liyuze.id,
      borrowerId: users.chenxinyi.id,
      startDate: completedStart,
      endDate: completedEnd,
      totalDays: 3,
      totalPrice: 12,
      deposit: 40,
      note: '考试周临时借用计算器，按时归还。',
      pickupLocation: '理工楼 B 座值班台',
      returnLocation: '理工楼 B 座值班台',
      status: 'completed',
      pickupCode: createCode(),
      returnCode: createCode(),
      pickupCodeVerifiedAt: addDays(now, -9, 8),
      pickupConfirmedByLenderAt: completedStart,
      actualPickupTime: completedStart,
      returnCodeVerifiedAt: addDays(now, -6, 17),
      returnConfirmedByLenderAt: completedEnd,
      actualReturnTime: completedEnd,
      returnConfirmedTime: completedEnd,
      pendingConfirmation: false,
      pendingExtension: false
    });

    orders.usingPowerbank = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.powerbank.id,
      lenderId: users.wanghaoran.id,
      borrowerId: users.zhaomengqi.id,
      startDate: usingStart,
      endDate: usingEnd,
      totalDays: 4,
      totalPrice: 12,
      deposit: 30,
      note: '五一外出拍照补电，附带 Type‑C 线。',
      pickupLocation: '信息楼 207 实验室门口',
      returnLocation: '信息楼 207 实验室门口',
      status: 'using',
      pickupCode: createCode(),
      returnCode: createCode(),
      pickupCodeVerifiedAt: addDays(now, -2, 9),
      pickupConfirmedByLenderAt: usingStart,
      actualPickupTime: usingStart,
      pendingConfirmation: false,
      pendingExtension: false
    });

    orders.confirmedCamera = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.camera.id,
      lenderId: users.liyuze.id,
      borrowerId: users.liujiawen.id,
      startDate: confirmedStart,
      endDate: confirmedEnd,
      totalDays: 2,
      totalPrice: 76,
      deposit: 600,
      note: '英语短片作业拍摄使用，周末借两天。',
      pickupLocation: '图书馆南门自助借还柜',
      returnLocation: '图书馆南门自助借还柜',
      status: 'confirmed',
      pickupCode: createCode(),
      returnCode: createCode(),
      pendingConfirmation: false,
      pendingExtension: false,
      cancelReason: null
    });

    orders.cancelledIpad = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.ipad.id,
      lenderId: users.wanghaoran.id,
      borrowerId: users.sunyifan.id,
      startDate: cancelledStart,
      endDate: cancelledEnd,
      totalDays: 2,
      totalPrice: 52,
      deposit: 500,
      note: '原计划用于课堂展示，后因课程分组调整取消。',
      pickupLocation: '信息楼一层大厅',
      returnLocation: '信息楼一层大厅',
      status: 'cancelled',
      pickupCode: createCode(),
      returnCode: createCode(),
      pendingConfirmation: false,
      pendingExtension: false,
      cancelReason: '课程分组变更，无需再借用平板。'
    });

    orders.returnedRacket = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.racket.id,
      lenderId: users.zhaomengqi.id,
      borrowerId: users.chenxinyi.id,
      startDate: disputeStart,
      endDate: disputeEnd,
      totalDays: 3,
      totalPrice: 18,
      deposit: 80,
      note: '体育馆双打训练使用，归还后对拍框磨损责任有争议。',
      pickupLocation: '体育馆西侧器材寄存点',
      returnLocation: '体育馆西侧器材寄存点',
      status: 'returned',
      pickupCode: createCode(),
      returnCode: createCode(),
      pickupCodeVerifiedAt: addDays(now, -4, 15),
      pickupConfirmedByLenderAt: disputeStart,
      actualPickupTime: disputeStart,
      returnCodeVerifiedAt: addDays(now, -1, 19),
      returnConfirmedByLenderAt: disputeEnd,
      actualReturnTime: disputeEnd,
      pendingConfirmation: false,
      pendingExtension: false
    });

    orders.returnedProjector = await Order.create({
      orderNo: createOrderNo(),
      itemId: items.projector.id,
      lenderId: users.wanghaoran.id,
      borrowerId: users.liujiawen.id,
      startDate: resolvedStart,
      endDate: resolvedEnd,
      totalDays: 3,
      totalPrice: 105,
      deposit: 700,
      note: '小组汇报借用，归还后对机身新增划痕与赔付金额存在争议。',
      pickupLocation: '创新创业中心前台',
      returnLocation: '创新创业中心前台',
      status: 'returned',
      pickupCode: createCode(),
      returnCode: createCode(),
      pickupCodeVerifiedAt: addDays(now, -5, 13),
      pickupConfirmedByLenderAt: resolvedStart,
      actualPickupTime: resolvedStart,
      returnCodeVerifiedAt: addDays(now, -2, 20),
      returnConfirmedByLenderAt: resolvedEnd,
      actualReturnTime: resolvedEnd,
      pendingConfirmation: false,
      pendingExtension: false
    });

    console.log('  创建了 completed / using / confirmed / cancelled / returned 演示订单');

    await Favorite.bulkCreate([
      { userId: users.chenxinyi.id, itemId: items.camera.id },
      { userId: users.liujiawen.id, itemId: items.ipad.id },
      { userId: users.sunyifan.id, itemId: items.calculator.id },
      { userId: users.zhaomengqi.id, itemId: items.keyboard.id }
    ]);

    await OrderReminderLog.bulkCreate([
      {
        orderId: orders.usingPowerbank.id,
        receiverId: users.zhaomengqi.id,
        reminderType: 'daily-rent-pay',
        reminderDate: toDateOnly(now)
      },
      {
        orderId: orders.usingPowerbank.id,
        receiverId: users.wanghaoran.id,
        reminderType: 'daily-rent-receive',
        reminderDate: toDateOnly(now)
      }
    ]);

    await Message.bulkCreate([
      {
        senderId: users.liujiawen.id,
        receiverId: users.liyuze.id,
        itemId: items.camera.id,
        content: '这台相机周六上午可以在图书馆南门取吗？我想拍课程短片。',
        type: 'text',
        isRead: true
      },
      {
        senderId: users.liyuze.id,
        receiverId: users.liujiawen.id,
        itemId: items.camera.id,
        content: '可以，电池和充电器都会一起带上，提前半小时联系我就行。',
        type: 'text',
        isRead: false
      },
      {
        senderId: users.zhaomengqi.id,
        receiverId: users.wanghaoran.id,
        itemId: items.powerbank.id,
        content: '充电宝我已经拿到了，Type‑C 线也在，返程当天晚上归还。',
        type: 'text',
        relatedId: orders.usingPowerbank.id,
        relatedType: 'order',
        isRead: false
      },
      {
        senderId: users.wanghaoran.id,
        receiverId: users.zhaomengqi.id,
        itemId: items.powerbank.id,
        content: '好的，返校后直接在实验室门口交接就行。',
        type: 'text',
        relatedId: orders.usingPowerbank.id,
        relatedType: 'order',
        isRead: true
      },
      {
        senderId: users.chenxinyi.id,
        receiverId: users.liyuze.id,
        itemId: items.calculator.id,
        content: '谢谢借我计算器，考试结束后我已经按时放回值班台。',
        type: 'text',
        relatedId: orders.completedCalculator.id,
        relatedType: 'order',
        isRead: true
      },
      {
        senderId: null,
        receiverId: users.sunyifan.id,
        itemId: items.ipad.id,
        content: '您的 iPad Air 订单已取消，押金无需支付。',
        type: 'system',
        relatedId: orders.cancelledIpad.id,
        relatedType: 'order',
        isRead: false
      }
    ]);

    await Review.bulkCreate([
      {
        orderId: orders.completedCalculator.id,
        reviewerId: users.chenxinyi.id,
        revieweeId: users.liyuze.id,
        rating: 5,
        content: '计算器按键灵敏，交接准时，考试周临时借用非常方便。'
      },
      {
        orderId: orders.completedCalculator.id,
        reviewerId: users.liyuze.id,
        revieweeId: users.chenxinyi.id,
        rating: 5,
        content: '沟通顺畅，归还及时，物品保管得很仔细。'
      }
    ]);

    const awaitingDispute = await createDispute({
      order: orders.returnedRacket,
      initiatorId: users.zhaomengqi.id,
      statement: '归还时发现拍框边缘有新的磨损痕迹，希望对责任归属和押金扣减比例进行确认。',
      images: [`${DEMO_IMAGE_BASE}/yonex-racket-detail.jpg`]
    });

    const createdResolvedDispute = await createDispute({
      order: orders.returnedProjector,
      initiatorId: users.liujiawen.id,
      statement: '归还时对方提出机身外壳有新增划痕，但我认为借出前已有轻微使用痕迹，希望管理员核实。',
      images: [`${DEMO_IMAGE_BASE}/sony-projector-detail.jpg`]
    });

    const respondedResolvedDispute = await respondToDispute({
      dispute: createdResolvedDispute,
      userId: users.wanghaoran.id,
      statement: '借出前我已拍过机身照片，右侧边角原本没有这道划痕，因此申请按照维修估价承担部分赔付。',
      images: [`${DEMO_IMAGE_BASE}/sony-projector-scratch.jpg`]
    });

    const resolvedDispute = await resolveDispute({
      dispute: respondedResolvedDispute,
      adminId: users.admin.id,
      verdict: 'borrower_responsible',
      lossAmount: 120,
      resolutionNote: '比对借出前后照片后，认定新增划痕发生在借用期间，由借方承担 120 元维护费用，并扣减信誉分。',
      borrowerPenaltyScore: 12,
      lenderPenaltyScore: 0,
      restrictionHours: 24
    });

    console.log(`  创建纠纷: #${awaitingDispute.id}（待对方补充）`);
    console.log(`  创建纠纷: #${resolvedDispute.id}（已裁决）`);

    console.log('\n✅ 毕设演示数据初始化完成！');
    console.log('账号摘要：');
    for (const row of accountRows) {
      const loginAccount = row.role === 'user'
        ? `学号 ${row.studentId} 或手机号 ${row.phone}`
        : `用户名 ${row.username}`;
      console.log(`  [${row.role}] ${row.username} -> ${loginAccount} / ${DEFAULT_PASSWORD}`);
    }
    console.log(`待演示申请纠纷订单 ID: ${orders.confirmedCamera.id}`);
    console.log(`待对方补充纠纷 ID: ${awaitingDispute.id}`);
    console.log(`已裁决纠纷 ID: ${resolvedDispute.id}`);

    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
};

initMockData();
