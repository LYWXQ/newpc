const sequelize = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 初始化超级用户账户
async function initSuperadmin() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // 检查是否已存在超级用户
    const existingSuperadmin = await User.findOne({ where: { role: 'superadmin' } });
    
    if (existingSuperadmin) {
      console.log('Superadmin account already exists.');
      return;
    }
    
    // 创建超级用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const superadmin = await User.create({
      username: 'superadmin',
      password: hashedPassword,
      role: 'root',
      isVerified: true,
      status: 'active'
    });
    
    console.log('Superadmin account created successfully:', superadmin.toJSON());
    
  } catch (error) {
    console.error('Error creating superadmin account:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行初始化
initSuperadmin();
