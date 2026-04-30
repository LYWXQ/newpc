const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderReminderLog = sequelize.define('OrderReminderLog', {
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
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '接收人ID'
  },
  reminderType: {
    type: DataTypes.ENUM('daily-rent-pay', 'daily-rent-receive'),
    allowNull: false,
    comment: '提醒类型'
  },
  reminderDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '提醒日期'
  }
}, {
  tableName: 'order_reminder_logs',
  timestamps: true,
  comment: '订单提醒日志表',
  indexes: [
    {
      name: 'uniq_order_daily_reminder',
      unique: true,
      fields: ['orderId', 'receiverId', 'reminderType', 'reminderDate']
    }
  ]
});

module.exports = OrderReminderLog;
