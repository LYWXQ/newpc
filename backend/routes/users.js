const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

// 权限检查中间件
const checkAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

const checkSuperadmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Superadmin privileges required.' });
  }
  next();
};

// 获取用户信息
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'studentId', 'username', 'avatar', 'creditScore', 'isVerified', 'role', 'status']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
});

// 更新用户信息 (支持POST和PUT)
const updateProfile = async (req, res) => {
  try {
    const { avatar, phone, email, school, major } = req.body;
    const user = req.user;
    
    // 验证手机号格式
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: '请输入正确的手机号' });
    }
    
    // 检查手机号是否被其他用户使用
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ message: '该手机号已被其他用户使用' });
      }
    }
    
    await user.update({
      avatar: avatar !== undefined ? avatar : user.avatar,
      phone: phone !== undefined ? phone : user.phone,
      email: email !== undefined ? email : user.email,
      school: school !== undefined ? school : user.school,
      major: major !== undefined ? major : user.major
    });
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        studentId: user.studentId,
        username: user.username,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
        school: user.school,
        major: user.major,
        creditScore: user.creditScore,
        isVerified: user.isVerified,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

router.put('/profile', authenticateToken, updateProfile);
router.post('/profile', authenticateToken, updateProfile);

// 上传头像
router.post('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    const user = req.user;
    
    if (!avatar) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }
    
    await user.update({ avatar });
    
    res.json({
      message: 'Avatar updated successfully',
      url: avatar
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update avatar', error: error.message });
  }
});

// 获取用户列表（仅管理员和超级管理员）
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'studentId', 'username', 'avatar', 'creditScore', 'isVerified', 'role', 'status', 'createdAt']
    });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
});

// 创建管理员账户（仅超级管理员）
router.post('/admin', authenticateToken, checkSuperadmin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already registered' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建管理员
    const user = await User.create({
      username,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      status: 'active'
    });
    
    res.status(201).json({
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create admin account', error: error.message });
  }
});

// 更新用户角色（仅超级管理员）
router.put('/:id/role', authenticateToken, checkSuperadmin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 不能修改超级管理员的角色
    if (user.role === 'superadmin') {
      return res.status(400).json({ message: 'Cannot change superadmin role' });
    }
    
    await user.update({ role });
    
    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        studentId: user.studentId,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
});

// 更新用户状态（仅管理员和超级管理员）
router.put('/:id/status', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 不能修改超级管理员的状态
    if (user.role === 'superadmin') {
      return res.status(400).json({ message: 'Cannot change superadmin status' });
    }
    
    await user.update({ status });
    
    res.json({
      message: 'User status updated successfully',
      user: {
        id: user.id,
        studentId: user.studentId,
        username: user.username,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
});

module.exports = router;