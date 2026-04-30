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
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '借用开始时间',
    get() {
      return this.getDataValue('startDate') || this.getDataValue('legacyStartDate');
    },
    set(value) {
      this.setDataValue('startDate', value);
      this.setDataValue('legacyStartDate', value);
    }
  },
  legacyStartDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'startTime'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '借用结束时间',
    get() {
      return this.getDataValue('endDate') || this.getDataValue('legacyEndDate');
    },
    set(value) {
      this.setDataValue('endDate', value);
      this.setDataValue('legacyEndDate', value);
    }
  },
  legacyEndDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'endTime'
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
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注',
    get() {
      const note = this.getDataValue('note');
      return note !== null && note !== undefined ? note : this.getDataValue('legacyNote');
    },
    set(value) {
      this.setDataValue('note', value);
      this.setDataValue('legacyNote', value);
    }
  },
  legacyNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'remark'
  },
  cancelReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '取消原因'
  },
  pickupLocation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '取货地点'
  },
  returnLocation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '还货地点'
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
  },
  returnCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '归还码'
  },
  pickupCodeVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '买方已验证取件码时间'
  },
  pickupConfirmedByLenderAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '卖方确认已交付时间'
  },
  actualPickupTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '实际取货时间'
  },
  returnCodeVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '买方已验证归还码时间'
  },
  returnConfirmedByLenderAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '卖方确认已收回时间'
  },
  actualReturnTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '实际归还时间'
  },
  returnConfirmedTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '订单最终完成时间'
  },
  isEarlyReturn: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否提前归还'
  },
  pendingConfirmation: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否待借方确认变更'
  },
  pendingExtension: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否待卖方确认延期'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  comment: '订单表'
});

module.exports = Order;
