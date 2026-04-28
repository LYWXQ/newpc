const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const { User, Item, Order, Review, Message, Favorite } = require('./models');

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
    
    // 同步数据库模型（使用 alter: true 来更新表结构，保持现有数据）
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized with alter: true.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();

module.exports = app;
