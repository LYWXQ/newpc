const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminActionLog = sequelize.define('AdminActionLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '管理员ID'
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '目标用户ID'
  },
  targetOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '目标订单ID'
  },
  targetDisputeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '目标纠纷ID'
  },
  actionType: {
    type: DataTypes.ENUM('create_admin', 'deactivate_admin', 'reactivate_admin', 'delete_admin', 'mark_violation', 'apply_restriction', 'adjust_credit', 'resolve_dispute', 'reset_password'),
    allowNull: false,
    comment: '操作类型'
  },
  summary: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '操作摘要'
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作详情'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '附加元数据'
  }
}, {
  tableName: 'admin_action_logs',
  timestamps: true,
  comment: '管理员操作日志表'
});

module.exports = AdminActionLog;
