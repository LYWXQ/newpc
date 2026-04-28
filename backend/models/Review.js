const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '评价者ID'
  },
  revieweeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '被评价者ID'
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    comment: '评分（1-5星，支持半星）'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '评价内容'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '评价图片数组'
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  comment: '评价表'
});

module.exports = Review;