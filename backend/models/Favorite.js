const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '物品ID',
    references: {
      model: 'items',
      key: 'id'
    }
  }
}, {
  tableName: 'favorites',
  timestamps: true,
  comment: '用户收藏表',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'itemId'],
      comment: '用户和物品的唯一组合'
    }
  ]
});

module.exports = Favorite;
