const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User } = require('../models');

const initUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await User.sync({ alter: { drop: false } });
    console.log('用户表同步完成');

    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = [
      {
        username: 'user421',
        studentId: '202214060421',
        phone: '13800000000',
        qq: '1234566',
        password: hashedPassword,
        role: 'user',
        creditScore: 100,
        isVerified: false,
        status: 'active'
      },
      {
        username: 'user',
        studentId: '202214060422',
        phone: '13800000001',
        qq: '1234567',
        password: hashedPassword,
        role: 'user',
        creditScore: 100,
        isVerified: false,
        status: 'active'
      },
      {
        username: 'buyer',
        studentId: '202214060423',
        phone: '13800000002',
        qq: '1234568',
        password: hashedPassword,
        role: 'user',
        creditScore: 100,
        isVerified: true,
        status: 'active'
      },
      {
        username: 'seller',
        studentId: '202214060424',
        phone: '13800000003',
        qq: '1234569',
        password: hashedPassword,
        role: 'user',
        creditScore: 100,
        isVerified: true,
        status: 'active'
      },
      {
        username: 'lowcredit',
        studentId: '202214060425',
        phone: '13800000004',
        qq: '1234570',
        password: hashedPassword,
        role: 'user',
        creditScore: 55,
        isVerified: true,
        status: 'active',
        isViolationUser: true,
        violationMarkedAt: new Date(),
        violationReason: '初始化低信誉测试账号'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({
        where: { studentId: userData.studentId }
      });

      if (existingUser) {
        console.log(`学号 ${userData.studentId} 已存在，更新中...`);
        await existingUser.update(userData);
      } else {
        console.log(`创建用户 ${userData.username}（学号 ${userData.studentId}）...`);
        await User.create(userData);
      }
    }

    console.log('✅ 用户初始化完成！');
    console.log('\n测试账号：');
    console.log('  user421 (普通用户): 学号 202214060421 或手机号 13800000000 / 123456');
    console.log('  user (普通用户): 学号 202214060422 或手机号 13800000001 / 123456');
    console.log('  buyer (普通用户): 学号 202214060423 或手机号 13800000002 / 123456');
    console.log('  seller (普通用户): 学号 202214060424 或手机号 13800000003 / 123456');
    console.log('  lowcredit (低信誉): 学号 202214060425 或手机号 13800000004 / 123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ 用户初始化失败:', error);
    process.exit(1);
  }
};

initUsers();
