const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const { User, Item, Order, Review, Message, Favorite, OrderReminderLog } = require('./models');
const { sweepExpiredDeletionUsers } = require('./accountLifecycle');
const { startOrderReminderScheduler } = require('./services/orderReminderScheduler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/items', require('./routes/items'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/favorites', require('./routes/favorites'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const ensureSchemaCompatibility = async () => {
  await sequelize.query(`
    ALTER TABLE items
    MODIFY COLUMN status ENUM('available','reserved','rented','offline','reviewing') DEFAULT 'reviewing'
  `);

  await sequelize.query(`
    ALTER TABLE messages
    MODIFY COLUMN senderId INT NULL COMMENT '发送者ID'
  `);
};

const syncApplicationModels = async () => {
  const modelsWithAlter = [User, Item, Order, Review, Message, Favorite]

  for (const model of modelsWithAlter) {
    await model.sync({ alter: { drop: false } })
  }

  await OrderReminderLog.sync()

  await sequelize.query(`
    ALTER TABLE order_reminder_logs
    ADD UNIQUE INDEX uniq_order_daily_reminder (orderId, receiverId, reminderType, reminderDate)
  `).catch((error) => {
    if (!['ER_DUP_KEYNAME', 'ER_DUP_ENTRY'].includes(error?.original?.code)) {
      throw error
    }
  })
};

// 数据库连接和服务器启动
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // 先删除disputes表（如果存在）
    try {
      await sequelize.query('DROP TABLE IF EXISTS disputes;');
      console.log('Disputes table dropped if existed.');
    } catch (err) {
      console.log('No disputes table found, continuing...');
    }
    
    // 按模型同步，避免 OrderReminderLog 在 alter 阶段生成超长索引名
    await syncApplicationModels();
    await ensureSchemaCompatibility();
    console.log('Database models synchronized.');

    const deletionSweepResults = await sweepExpiredDeletionUsers();
    if (deletionSweepResults.length > 0) {
      console.log('Expired deletion sweep results:', deletionSweepResults);
    }

    startOrderReminderScheduler();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();

module.exports = app;
