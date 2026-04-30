const sequelize = require('../config/database');
const { User } = require('../models');
const { Op } = require('sequelize');

const normalizeUserRoles = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    const [affectedCount] = await User.update(
      { role: 'user' },
      {
        where: {
          role: {
            [Op.in]: ['admin', 'root', 'superadmin']
          }
        }
      }
    );

    console.log(`已将 ${affectedCount} 个非普通用户角色清洗为 user`);
    process.exit(0);
  } catch (error) {
    console.error('角色清洗失败:', error);
    process.exit(1);
  }
};

normalizeUserRoles();
