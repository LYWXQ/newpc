const sequelize = require('./config/database');

async function migrate() {
  try {
    console.log('开始数据库迁移...');
    
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 检查 transactionType 列是否存在
    const [columns] = await sequelize.query(`SHOW COLUMNS FROM items LIKE 'transactionType'`);
    
    if (columns.length === 0) {
      console.log('添加 transactionType 列...');
      await sequelize.query(`
        ALTER TABLE items 
        ADD COLUMN transactionType ENUM('free', 'rent', 'sell') DEFAULT 'rent' COMMENT '交易类型'
      `);
      console.log('transactionType 列添加成功');
    } else {
      console.log('transactionType 列已存在，跳过');
    }

    // 检查 salePrice 列是否存在
    const [salePriceColumns] = await sequelize.query(`SHOW COLUMNS FROM items LIKE 'salePrice'`);
    
    if (salePriceColumns.length === 0) {
      console.log('添加 salePrice 列...');
      await sequelize.query(`
        ALTER TABLE items 
        ADD COLUMN salePrice DECIMAL(10,2) NULL COMMENT '出售价格'
      `);
      console.log('salePrice 列添加成功');
    } else {
      console.log('salePrice 列已存在，跳过');
    }

    // 检查 isLongTermRent 列是否存在
    const [isLongTermRentColumns] = await sequelize.query(`SHOW COLUMNS FROM items LIKE 'isLongTermRent'`);
    
    if (isLongTermRentColumns.length === 0) {
      console.log('添加 isLongTermRent 列...');
      await sequelize.query(`
        ALTER TABLE items 
        ADD COLUMN isLongTermRent TINYINT(1) DEFAULT 0 COMMENT '是否长期租用'
      `);
      console.log('isLongTermRent 列添加成功');
    } else {
      console.log('isLongTermRent 列已存在，跳过');
    }

    console.log('数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

migrate();
