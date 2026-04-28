const sequelize = require('../config/database');
const { User } = require('../models');

const checkUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    const users = await User.findAll({
      attributes: ['id', 'studentId', 'username', 'role', 'status']
    });

    console.log('\n数据库中的用户列表:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, 学号: ${user.studentId}, 用户名: ${user.username}, 角色: ${user.role}, 状态: ${user.status}`);
    });

    // 尝试查找测试用户
    const testUserByUsername = await User.findOne({ where: { username: 'user' } });
    console.log('\n按用户名查找user:', testUserByUsername ? `找到 - 学号: ${testUserByUsername.studentId}` : '未找到');

    const testUserByStudentId = await User.findOne({ where: { studentId: '202214060422' } });
    console.log('按学号查找202214060422:', testUserByStudentId ? `找到 - 用户名: ${testUserByStudentId.username}` : '未找到');

    process.exit(0);
  } catch (error) {
    console.error('检查用户失败:', error);
    process.exit(1);
  }
};

checkUsers();
