const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User } = require('../models');

const initUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ force: true });
    console.log('数据库同步完成');

    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = [
      {
        username: 'root',
        password: hashedPassword,
        role: 'root',
        creditScore: 100,
        isVerified: true,
        status: 'active'
      },
      {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        creditScore: 100,
        isVerified: true,
        status: 'active'
      },
      {
        username: 'user',
        studentId: '202214060422',
        password: hashedPassword,
        role: 'user',
        creditScore: 100,
        isVerified: false,
        status: 'active'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({
        where: { username: userData.username }
      });

      if (existingUser) {
        console.log(`用户 ${userData.username} 已存在，更新中...`);
        await existingUser.update(userData);
      } else {
        console.log(`创建用户 ${userData.username}...`);
        await User.create(userData);
      }
    }

    console.log('✅ 用户初始化完成！');
    console.log('\n测试账号：');
    console.log('  root (超级用户): root / 123456');
    console.log('  admin (管理员): admin / 123456');
    console.log('  user (普通用户): user / 123456 (学号: 202214060422)');

    process.exit(0);
  } catch (error) {
    console.error('❌ 用户初始化失败:', error);
    process.exit(1);
  }
};

initUsers();
