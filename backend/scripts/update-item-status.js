const { Item } = require('../models');
const sequelize = require('../config/database');

async function updateItemStatus() {
  try {
    console.log('开始更新物品状态...');
    
    const [updatedCount] = await Item.update(
      { status: 'available' },
      { where: { status: 'reviewing' } }
    );
    
    console.log(`成功更新了 ${updatedCount} 个物品的状态`);
    
    const items = await Item.findAll({
      attributes: ['id', 'title', 'status']
    });
    
    console.log('\n当前物品状态：');
    items.forEach(item => {
      console.log(`ID: ${item.id}, 标题: ${item.title}, 状态: ${item.status}`);
    });
    
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

updateItemStatus();
