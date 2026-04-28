const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: '学号（普通用户必填，管理员和root可以为空）'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    comment: '用户名（所有用户必填）'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像URL'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱'
  },
  school: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '学校名称'
  },
  major: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '专业名称'
  },
  creditScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: '诚信分'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否认证'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    comment: '账号状态'
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'user',
    comment: '用户角色：user-普通用户，admin-管理员，root-超级用户'
  }
}, {
  tableName: 'users',
  timestamps: true,                                                                                            
  comment: '用户表'
});

module.exports = User;
