const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const {
  DELETION_STATUS,
  buildPendingLoginToken,
  cancelUserDeletion,
  isDeletedUser,
  isDeletionExpired,
  isPendingDeletion,
  isValidQQ,
  processExpiredDeletionForUser,
  serializeUser,
  verifyPendingLoginToken
} = require('../accountLifecycle');
const { Op } = require('sequelize');

const buildLoginSuccessResponse = (user) => ({
  message: '登录成功',
  token: generateToken(user.id, user.role),
  user: serializeUser(user)
});

// 用户注册（仅普通用户可以注册）
const register = async (req, res) => {
  try {
    const { studentId, username, password, school, major, phone, qq } = req.body;

    if (!studentId || !username || !password || !phone || !qq) {
      return res.status(400).json({ message: '学号、用户名、密码、手机号和QQ不能为空' });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: '请输入正确的手机号' });
    }

    if (!isValidQQ(qq)) {
      return res.status(400).json({ message: '请输入正确的QQ号' });
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
      qq,
      creditScore: 100,
      isVerified: false,
      role: 'user',
      deletionStatus: DELETION_STATUS.NONE
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: '注册成功',
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '注册失败', error: error.message });
  }
};

// 用户登录（普通用户支持学号和手机号，管理员支持用户名登录）
const login = async (req, res) => {
  try {
    const { account, password, loginType = 'user' } = req.body;
    console.log('登录请求 - account:', account, 'loginType:', loginType, 'account type:', typeof account);

    if (!account || !password) {
      return res.status(400).json({ message: '账号和密码不能为空' });
    }

    let user = null;

    if (loginType === 'admin') {
      user = await User.findOne({
        where: {
          username: account,
          role: {
            [Op.in]: ['admin', 'root', 'superadmin']
          }
        }
      });
    } else {
      user = await User.findOne({
        where: {
          role: 'user',
          [Op.or]: [
            { studentId: account },
            { phone: account }
          ]
        }
      });
    }

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

    if (isDeletedUser(user)) {
      return res.status(403).json({ message: '账号已注销' });
    }

    const expiredResult = await processExpiredDeletionForUser(user);
    if (expiredResult.processed) {
      return res.status(403).json({ message: '账号已注销' });
    }

    if (isPendingDeletion(user)) {
      return res.json({
        message: '账号正在注销冷静期内，请选择后续操作',
        actionRequired: 'confirmDeletionLogin',
        pendingLoginToken: buildPendingLoginToken(user),
        deletionStatus: user.deletionStatus,
        deletionRequestedAt: user.deletionRequestedAt,
        deletionDeadlineAt: user.deletionDeadlineAt,
        userPreview: {
          id: user.id,
          studentId: user.studentId,
          username: user.username,
          avatar: user.avatar,
          role: user.role
        }
      });
    }

    res.json(buildLoginSuccessResponse(user));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    if (isDeletionExpired(user)) {
      await processExpiredDeletionForUser(user);
      return res.status(403).json({ message: '账号已注销' });
    }

    res.json(serializeUser(user));
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
};

const resolveDeletionLogin = async (req, res) => {
  try {
    const { pendingLoginToken, action } = req.body;

    if (!pendingLoginToken || !['continue', 'abort'].includes(action)) {
      return res.status(400).json({ message: '登录确认参数无效' });
    }

    const payload = verifyPendingLoginToken(pendingLoginToken);
    const user = await User.findByPk(payload.userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (isDeletedUser(user)) {
      return res.status(403).json({ message: '账号已注销' });
    }

    const expiredResult = await processExpiredDeletionForUser(user);
    if (expiredResult.processed) {
      return res.status(403).json({ message: '账号已注销' });
    }

    if (!isPendingDeletion(user)) {
      return res.status(400).json({ message: '当前账号不在注销冷静期内' });
    }

    if (payload.deletionRequestedAt && user.deletionRequestedAt && payload.deletionRequestedAt !== new Date(user.deletionRequestedAt).getTime()) {
      return res.status(409).json({ message: '注销状态已变更，请重新登录' });
    }

    if (payload.deletionDeadlineAt && user.deletionDeadlineAt && payload.deletionDeadlineAt !== new Date(user.deletionDeadlineAt).getTime()) {
      return res.status(409).json({ message: '注销状态已变更，请重新登录' });
    }

    if (action === 'abort') {
      return res.json({
        message: '已中断登录，账号将继续按原计划注销',
        aborted: true,
        deletionStatus: user.deletionStatus,
        deletionRequestedAt: user.deletionRequestedAt,
        deletionDeadlineAt: user.deletionDeadlineAt
      });
    }

    await cancelUserDeletion(user);

    res.json({
      message: '登录成功，已取消注销申请',
      token: generateToken(user.id, user.role),
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Resolve deletion login error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '登录确认已失效，请重新登录' });
    }
    res.status(500).json({ message: '处理登录确认失败', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  resolveDeletionLogin
};
