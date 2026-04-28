const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('开始数据库迁移...');

    await sequelize.query(`
      ALTER TABLE items 
      ADD COLUMN transactionType ENUM('free', 'rent', 'sell') DEFAULT 'rent' COMMENT '交易类型' 
      AFTER deposit
    `);
    console.log('✓ 添加 transactionType 字段成功');

    await sequelize.query(`
      ALTER TABLE items 
      ADD COLUMN salePrice DECIMAL(10,2) DEFAULT NULL COMMENT '出售价格' 
      AFTER transactionType
    `);
    console.log('✓ 添加 salePrice 字段成功');

    await sequelize.query(`
      ALTER TABLE items 
      ADD COLUMN isLongTermRent TINYINT(1) DEFAULT 0 COMMENT '是否长期租用' 
      AFTER availableTime
    `);
    console.log('✓ 添加 isLongTermRent 字段成功');

    console.log('\n迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error.message);
    if (error.message.includes('Duplicate column name')) {
      console.log('提示：字段可能已存在，迁移可以继续进行');
    } else {
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

async function rollback() {
  try {
    console.log('开始回滚迁移...');

    await sequelize.query('ALTER TABLE items DROP COLUMN isLongTermRent');
    console.log('✓ 删除 isLongTermRent 字段成功');

    await sequelize.query('ALTER TABLE items DROP COLUMN salePrice');
    console.log('✓ 删除 salePrice 字段成功');

    await sequelize.query('ALTER TABLE items DROP COLUMN transactionType');
    console.log('✓ 删除 transactionType 字段成功');

    console.log('\n回滚完成！');
  } catch (error) {
    console.error('回滚失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

const action = process.argv[2];
if (action === 'rollback') {
  rollback();
} else {
  migrate();
}
