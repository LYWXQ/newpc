const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreditRecord = sequelize.define('CreditRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  changeType: {
    type: DataTypes.ENUM('increase', 'decrease'),
    allowNull: false,
    comment: '变更类型'
  },
  sourceType: {
    type: DataTypes.ENUM('order_completion', 'review', 'dispute', 'manual_adjustment', 'system'),
    allowNull: false,
    comment: '来源类型'
  },
  sourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '来源ID'
  },
  delta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '变动分值'
  },
  scoreBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '变更前分值'
  },
  scoreAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '变更后分值'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更原因'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作人ID'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '附加元数据'
  }
}, {
  tableName: 'credit_records',
  timestamps: true,
  comment: '信誉分流水表'
});

module.exports = CreditRecord;
