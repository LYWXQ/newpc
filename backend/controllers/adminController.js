const { Op } = require('sequelize');
const { User, Order, Item, Dispute, CreditRecord, UserRestriction, AdminActionLog } = require('../models');
const { serializeUser } = require('../accountLifecycle');
const { createAdminAccount, updateAdminStatus, deleteAdminAccount, markViolation, applyManualRestriction, adjustUserCredit, updateUserPasswordByAdmin } = require('../services/adminService');
const { loadDisputeById, resolveDispute } = require('../services/disputeService');

const normalizePage = (value, fallback = 1) => Math.max(parseInt(value || fallback, 10), 1);
const normalizeLimit = (value, fallback = 10) => Math.max(parseInt(value || fallback, 10), 1);

const buildPagination = (count, page, limit) => ({
  total: count,
  page,
  limit,
  totalPages: Math.ceil(count / limit)
});

const getAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: {
        role: { [Op.in]: ['admin', 'super_admin'] }
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({ admins: admins.map(serializeUser) });
  } catch (error) {
    res.status(500).json({ message: '获取管理员列表失败', error: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { username, password, role = 'admin' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    if (role !== 'admin') {
      return res.status(400).json({ message: '当前仅支持创建管理员账号' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '该用户名已被使用' });
    }

    const admin = await createAdminAccount({
      adminUserId: req.user.id,
      username,
      password,
      role
    });

    res.status(201).json({
      message: '管理员创建成功',
      admin: serializeUser(admin)
    });
  } catch (error) {
    res.status(500).json({ message: '创建管理员失败', error: error.message });
  }
};

const deactivateAdmin = async (req, res) => {
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser || targetUser.role !== 'admin') {
      return res.status(404).json({ message: '管理员不存在' });
    }

    await updateAdminStatus({ adminUserId: req.user.id, targetUser, status: 'inactive' });

    res.json({ message: '管理员已停用', admin: serializeUser(targetUser) });
  } catch (error) {
    res.status(500).json({ message: '停用管理员失败', error: error.message });
  }
};

const reactivateAdmin = async (req, res) => {
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser || targetUser.role !== 'admin') {
      return res.status(404).json({ message: '管理员不存在' });
    }

    await updateAdminStatus({ adminUserId: req.user.id, targetUser, status: 'active' });

    res.json({ message: '管理员已恢复', admin: serializeUser(targetUser) });
  } catch (error) {
    res.status(500).json({ message: '恢复管理员失败', error: error.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser || targetUser.role !== 'admin') {
      return res.status(404).json({ message: '管理员不存在' });
    }

    await deleteAdminAccount({ adminUserId: req.user.id, targetUser });

    res.json({ message: '管理员已注销' });
  } catch (error) {
    res.status(500).json({ message: '注销管理员失败', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const { keyword, role = 'user', status, isViolationUser, page = 1, limit = 10 } = req.query;
    const pageNumber = normalizePage(page);
    const pageLimit = normalizeLimit(limit);
    const offset = (pageNumber - 1) * pageLimit;

    const where = { role };

    if (status) {
      where.status = status;
    }

    if (isViolationUser !== undefined) {
      where.isViolationUser = isViolationUser === 'true';
    }

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { studentId: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset
    });

    res.json({
      users: rows.map(serializeUser),
      pagination: buildPagination(count, pageNumber, pageLimit)
    });
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
};

const getUserDetail = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: CreditRecord, as: 'creditRecords', limit: 20, separate: true, order: [['createdAt', 'DESC']] },
        { model: UserRestriction, as: 'restrictions', limit: 20, separate: true, order: [['createdAt', 'DESC']] }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ user: serializeUser(user), creditRecords: user.creditRecords || [], restrictions: user.restrictions || [] });
  } catch (error) {
    res.status(500).json({ message: '获取用户详情失败', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ message: '无效的用户状态' });
    }

    await user.update({ status });

    res.json({ message: '用户状态已更新', user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: '更新用户状态失败', error: error.message });
  }
};

const updateUserViolation = async (req, res) => {
  try {
    const { isViolationUser, reason } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({ message: '用户不存在' });
    }

    await markViolation({
      adminUserId: req.user.id,
      targetUser: user,
      isViolationUser: Boolean(isViolationUser),
      reason
    });

    res.json({ message: '违规状态已更新', user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: '更新违规状态失败', error: error.message });
  }
};

const createUserRestriction = async (req, res) => {
  try {
    const { restrictionType, hours = 24, reason } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (!['trade', 'publish'].includes(restrictionType)) {
      return res.status(400).json({ message: '无效的限制类型' });
    }

    const restriction = await applyManualRestriction({
      adminUserId: req.user.id,
      targetUserId: user.id,
      restrictionType,
      hours,
      reason
    });

    res.status(201).json({ message: '限制已创建', restriction });
  } catch (error) {
    res.status(500).json({ message: '创建限制失败', error: error.message });
  }
};

const adjustCredit = async (req, res) => {
  try {
    const { delta, reason } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (!Number.isInteger(delta) || delta === 0) {
      return res.status(400).json({ message: 'delta 必须为非 0 整数' });
    }

    const record = await adjustUserCredit({
      adminUserId: req.user.id,
      targetUserId: user.id,
      delta,
      reason
    });

    res.status(201).json({ message: '信誉分已调整', record });
  } catch (error) {
    res.status(500).json({ message: '调整信誉分失败', error: error.message });
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const { newPassword, oldPassword } = req.body;
    const targetUser = await User.findByPk(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    await updateUserPasswordByAdmin({
      adminUser: req.user,
      targetUser,
      newPassword,
      oldPassword
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    const message = error.message || '修改密码失败';
    const statusCode = ['新密码不能为空', '管理员不可修改自己的密码', '管理员只能修改普通用户密码', '修改自己的密码时必须输入旧密码', '旧密码错误', '目标用户角色无效', '超级管理员只能修改自己的超级管理员密码'].includes(message) ? 400 : 500;
    res.status(statusCode).json({ message, error: statusCode === 500 ? error.message : undefined });
  }
};

const getOrders = async (req, res) => {
  try {
    const { keyword, status, page = 1, limit = 10 } = req.query;
    const pageNumber = normalizePage(page);
    const pageLimit = normalizeLimit(limit);
    const offset = (pageNumber - 1) * pageLimit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const itemWhere = keyword ? { title: { [Op.like]: `%${keyword}%` } } : undefined;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Item, as: 'item', where: itemWhere, required: Boolean(itemWhere) },
        { model: User, as: 'lender', attributes: ['id', 'username', 'phone'] },
        { model: User, as: 'borrower', attributes: ['id', 'username', 'phone'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset
    });

    res.json({ orders: rows, pagination: buildPagination(count, pageNumber, pageLimit) });
  } catch (error) {
    res.status(500).json({ message: '获取订单列表失败', error: error.message });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'lender', attributes: ['id', 'username', 'phone', 'creditScore'] },
        { model: User, as: 'borrower', attributes: ['id', 'username', 'phone', 'creditScore'] },
        { model: Dispute, as: 'dispute' }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: '获取订单详情失败', error: error.message });
  }
};

const getDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNumber = normalizePage(page);
    const pageLimit = normalizeLimit(limit);
    const offset = (pageNumber - 1) * pageLimit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Dispute.findAndCountAll({
      where,
      include: [
        { model: Order, as: 'order', include: [{ model: Item, as: 'item' }] },
        { model: User, as: 'borrower', attributes: ['id', 'username', 'creditScore'] },
        { model: User, as: 'lender', attributes: ['id', 'username', 'creditScore'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset
    });

    res.json({ disputes: rows, pagination: buildPagination(count, pageNumber, pageLimit) });
  } catch (error) {
    res.status(500).json({ message: '获取纠纷列表失败', error: error.message });
  }
};

const getDisputeDetail = async (req, res) => {
  try {
    const dispute = await loadDisputeById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: '纠纷不存在' });
    }

    res.json({ dispute });
  } catch (error) {
    res.status(500).json({ message: '获取纠纷详情失败', error: error.message });
  }
};

const resolveDisputeAction = async (req, res) => {
  try {
    const dispute = await loadDisputeById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: '纠纷不存在' });
    }

    const resolvedDispute = await resolveDispute({
      dispute,
      adminId: req.user.id,
      verdict: req.body.verdict,
      lossAmount: req.body.lossAmount,
      resolutionNote: req.body.resolutionNote,
      borrowerPenaltyScore: req.body.borrowerPenaltyScore || 0,
      lenderPenaltyScore: req.body.lenderPenaltyScore || 0,
      restrictionHours: req.body.restrictionHours || 24
    });

    res.json({ message: '纠纷已处理', dispute: resolvedDispute });
  } catch (error) {
    res.status(500).json({ message: '处理纠纷失败', error: error.message });
  }
};

const getAdminActionLogs = async (_req, res) => {
  try {
    const logs = await AdminActionLog.findAll({
      include: [
        { model: User, as: 'admin', attributes: ['id', 'username', 'role'] },
        { model: User, as: 'targetUser', attributes: ['id', 'username', 'role'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: '获取操作日志失败', error: error.message });
  }
};

module.exports = {
  getAdmins,
  createAdmin,
  deactivateAdmin,
  reactivateAdmin,
  deleteAdmin,
  getUsers,
  getUserDetail,
  updateUserStatus,
  updateUserViolation,
  createUserRestriction,
  adjustCredit,
  updateUserPassword,
  getOrders,
  getOrderDetail,
  getDisputes,
  getDisputeDetail,
  resolveDisputeAction,
  getAdminActionLogs
};
