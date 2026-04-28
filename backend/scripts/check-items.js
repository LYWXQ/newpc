const sequelize = require('../config/database');
const { Item } = require('../models');

const checkItems = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    const items = await Item.findAll({
      attributes: ['id', 'title', 'status', 'userId']
    });

    console.log('\n数据库中的物品列表:');
    items.forEach(item => {
      console.log(`  ID: ${item.id}, 标题: ${item.title}, 状态: ${item.status}, 用户ID: ${item.userId}`);
    });

    // 按状态统计
    const stats = {};
    items.forEach(item => {
      stats[item.status] = (stats[item.status] || 0) + 1;
    });
    console.log('\n按状态统计:');
    for (const [status, count] of Object.entries(stats)) {
      console.log(`  ${status}: ${count}个`);
    }

    process.exit(0);
  } catch (error) {
    console.error('检查物品失败:', error);
    process.exit(1);
  }
};

checkItems();
