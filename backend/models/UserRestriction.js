const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRestriction = sequelize.define('UserRestriction', {
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
  restrictionType: {
    type: DataTypes.ENUM('trade', 'publish'),
    allowNull: false,
    comment: '限制类型'
  },
  sourceType: {
    type: DataTypes.ENUM('dispute', 'manual', 'credit_threshold', 'system'),
    allowNull: false,
    comment: '限制来源'
  },
  sourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '来源ID'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '限制原因'
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '开始时间'
  },
  endsAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '结束时间'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否生效'
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
  tableName: 'user_restrictions',
  timestamps: true,
  comment: '用户限制记录表'
});

module.exports = UserRestriction;
