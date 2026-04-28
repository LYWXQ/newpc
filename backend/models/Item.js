const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '物品标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '物品描述'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '物品分类'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '物品图片数组'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '租金（元/天）'
  },
  deposit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '押金金额'
  },
  transactionType: {
    type: DataTypes.ENUM('free', 'rent', 'sell'),
    defaultValue: 'rent',
    comment: '交易类型'
  },
  salePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '出售价格'
  },
  isLongTermRent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否长期租用'
  },
  availableTime: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '可租时间段'
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '物品位置'
  },
  status: {
    type: DataTypes.ENUM('available', 'rented', 'offline', 'reviewing'),
    defaultValue: 'reviewing',
    comment: '物品状态'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览次数'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '发布者ID'
  }
}, {
  tableName: 'items',
  timestamps: true,
  comment: '物品表'
});

module.exports = Item;