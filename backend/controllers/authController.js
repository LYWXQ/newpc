const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// 用户注册（仅普通用户可以注册）
const register = async (req, res) => {
  try {
    const { studentId, username, password, school, major, phone } = req.body;

    if (!studentId || !username || !password || !phone) {
      return res.status(400).json({ message: '学号、用户名、密码和手机号不能为空' });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: '请输入正确的手机号' });
    }

    // 检查手机号是否已被注册
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: '该手机号已被注册' });
    }

    const existingStudentId = await User.findOne({ where: { studentId } });
    if (existingStudentId) {
      return res.status(400).json({ message: '该学号已被注册' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: '该用户名已被使用' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      studentId,
      username,
      password: hashedPassword,
      school,
      major,
      phone,
      creditScore: 100,
      isVerified: false,
      role: 'user'
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        username: user.username,
        school: user.school,
        major: user.major,
        phone: user.phone,
        creditScore: user.creditScore,
        isVerified: user.isVerified,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '注册失败', error: error.message });
  }
};

// 用户登录（支持学号和用户名登录）
const login = async (req, res) => {
  try {
    const { account, password } = req.body;
    console.log('登录请求 - account:', account, 'account type:', typeof account);

    if (!account || !password) {
      return res.status(400).json({ message: '账号和密码不能为空' });
    }

    // 使用Op.or同时查询用户名和学号
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { username: account },
          { studentId: account }
        ]
      }
    });
    console.log('查询结果:', user ? (user.username + ' / ' + user.studentId) : '未找到');

    if (!user) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        username: user.username,
        avatar: user.avatar,
        school: user.school,
        major: user.major,
        creditScore: user.creditScore,
        isVerified: user.isVerified,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    res.json({
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
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};
