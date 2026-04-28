const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '发送者ID'
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '接收者ID'
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联物品ID，用于区分不同物品的聊天'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '消息内容'
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'system'),
    defaultValue: 'text',
    comment: '消息类型'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已读'
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联ID（如订单ID）'
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '关联类型'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  comment: '消息表'
});

module.exports = Message;
