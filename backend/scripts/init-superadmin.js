const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User } = require('../models');

const initSuperadmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    const hashedPassword = await bcrypt.hash('123456', 10);
    const username = 'root';
    const legacyUsername = 'superadmin';

    const existingUser = await User.findOne({ where: { username } });
    const legacyUser = await User.findOne({ where: { username: legacyUsername } });

    if (existingUser) {
      await existingUser.update({
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

      if (legacyUser && legacyUser.id !== existingUser.id) {
        await legacyUser.destroy();
      }

      console.log('超级管理员已更新');
    } else if (legacyUser) {
      await legacyUser.update({
        username,
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
      console.log('已将旧 superadmin 账号收敛为 root');
    } else {
      await User.create({
        username,
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
        creditScore: 100,
        isVerified: true,
        isViolationUser: false,
        deletionStatus: 'none'
      });
      console.log('超级管理员已创建');
    }

    console.log('测试账号：root / 123456');
    process.exit(0);
  } catch (error) {
    console.error('初始化超级管理员失败:', error);
    process.exit(1);
  }
};

initSuperadmin();
