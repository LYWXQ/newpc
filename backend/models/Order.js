const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '订单编号'
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '物品ID'
  },
  lenderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '借出者ID'
  },
  borrowerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '借用者ID'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '借用开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '借用结束时间'
  },
  totalDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '借用天数'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '总租金'
  },
  deposit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '押金金额'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'using', 'returned', 'completed', 'cancelled'),
    defaultValue: 'pending',
    comment: '订单状态'
  },
  pickupCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '取件码'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  comment: '订单表'
});

module.exports = Order;