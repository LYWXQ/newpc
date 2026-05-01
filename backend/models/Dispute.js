const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dispute = sequelize.define('Dispute', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: '订单ID'
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '物品ID'
  },
  borrowerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '借方ID'
  },
  lenderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '卖方ID'
  },
  initiatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '发起人ID'
  },
  respondentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '被申请人ID'
  },
  status: {
    type: DataTypes.ENUM('open', 'awaiting_counterparty', 'under_review', 'resolved', 'cancelled'),
    allowNull: false,
    defaultValue: 'open',
    comment: '纠纷状态'
  },
  initiatorStatement: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '发起方说明'
  },
  initiatorImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: '发起方图片证据'
  },
  respondentStatement: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '被申请方说明'
  },
  respondentImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: '被申请方图片证据'
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '处理管理员ID'
  },
  verdict: {
    type: DataTypes.ENUM('borrower_responsible', 'lender_responsible', 'shared_responsibility', 'no_fault'),
    allowNull: true,
    comment: '裁决结果'
  },
  lossAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '损失金额'
  },
  resolutionNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '裁决说明'
  },
  borrowerPenaltyScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '借方扣分'
  },
  lenderPenaltyScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '卖方扣分'
  },
  restrictionEndsAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处罚限制截止时间'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理完成时间'
  }
}, {
  tableName: 'disputes',
  timestamps: true,
  comment: '纠纷表'
});

module.exports = Dispute;
