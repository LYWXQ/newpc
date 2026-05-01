const { AdminActionLog, User } = require('../models');
const bcrypt = require('bcryptjs');
const { createCreditRecord, applyRestriction, syncViolationState } = require('./creditService');

const logAdminAction = async ({ adminId, targetUserId = null, targetOrderId = null, targetDisputeId = null, actionType, summary, detail = null, metadata = null, transaction = undefined }) => {
  return AdminActionLog.create({
    adminId,
    targetUserId,
    targetOrderId,
    targetDisputeId,
    actionType,
    summary,
    detail,
    metadata
  }, { transaction });
};

const createAdminAccount = async ({ adminUserId, username, password, role = 'admin' }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const createdUser = await User.create({
    username,
    password: hashedPassword,
    role,
    status: 'active',
    creditScore: 100,
    isVerified: false,
    isViolationUser: false
  });

  await logAdminAction({
    adminId: adminUserId,
    targetUserId: createdUser.id,
    actionType: 'create_admin',
    summary: `创建${role === 'super_admin' ? '超级管理员' : '管理员'}账号`,
    metadata: { username, role }
  });

  return createdUser;
};

const updateAdminStatus = async ({ adminUserId, targetUser, status }) => {
  await targetUser.update({ status });

  await logAdminAction({
    adminId: adminUserId,
    targetUserId: targetUser.id,
    actionType: status === 'inactive' ? 'deactivate_admin' : 'reactivate_admin',
    summary: status === 'inactive' ? '停用管理员账号' : '恢复管理员账号',
    metadata: { status }
  });

  return targetUser;
};

const deleteAdminAccount = async ({ adminUserId, targetUser }) => {
  await logAdminAction({
    adminId: adminUserId,
    targetUserId: targetUser.id,
    actionType: 'delete_admin',
    summary: '注销管理员账号',
    metadata: { username: targetUser.username, role: targetUser.role }
  });

  await targetUser.destroy();
};

const markViolation = async ({ adminUserId, targetUser, isViolationUser, reason }) => {
  await targetUser.update({
    isViolationUser,
    violationMarkedAt: isViolationUser ? new Date() : null,
    violationReason: isViolationUser ? reason : null
  });

  await syncViolationState(targetUser, reason);

  await logAdminAction({
    adminId: adminUserId,
    targetUserId: targetUser.id,
    actionType: 'mark_violation',
    summary: isViolationUser ? '标记违规用户' : '解除违规标记',
    detail: reason || null,
    metadata: { isViolationUser }
  });

  return targetUser;
};

const applyManualRestriction = async ({ adminUserId, targetUserId, restrictionType, hours = 24, reason }) => {
  const restriction = await applyRestriction({
    userId: targetUserId,
    restrictionType,
    sourceType: 'manual',
    reason,
    hours,
    operatorId: adminUserId
  });

  await logAdminAction({
    adminId: adminUserId,
    targetUserId,
    actionType: 'apply_restriction',
    summary: '新增用户限制',
    detail: reason || null,
    metadata: { restrictionType, hours }
  });

  return restriction;
};

const adjustUserCredit = async ({ adminUserId, targetUserId, delta, reason }) => {
  const record = await createCreditRecord({
    userId: targetUserId,
    delta,
    sourceType: 'manual_adjustment',
    reason,
    operatorId: adminUserId
  });

  await logAdminAction({
    adminId: adminUserId,
    targetUserId,
    actionType: 'adjust_credit',
    summary: '人工调整信誉分',
    detail: reason || null,
    metadata: { delta }
  });

  return record;
};

const updateUserPasswordByAdmin = async ({ adminUser, targetUser, newPassword, oldPassword }) => {
  if (!newPassword) {
    throw new Error('新密码不能为空');
  }

  if (adminUser.role === 'admin') {
    if (targetUser.id === adminUser.id) {
      throw new Error('管理员不可修改自己的密码');
    }

    if (targetUser.role !== 'user') {
      throw new Error('管理员只能修改普通用户密码');
    }
  }

  if (adminUser.role === 'super_admin') {
    if (!['user', 'admin', 'super_admin'].includes(targetUser.role)) {
      throw new Error('目标用户角色无效');
    }

    if (targetUser.role === 'super_admin' && targetUser.id !== adminUser.id) {
      throw new Error('超级管理员只能修改自己的超级管理员密码');
    }

    if (targetUser.id === adminUser.id) {
      if (!oldPassword) {
        throw new Error('修改自己的密码时必须输入旧密码');
      }

      const isValidOldPassword = await bcrypt.compare(oldPassword, adminUser.password);
      if (!isValidOldPassword) {
        throw new Error('旧密码错误');
      }
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.sequelize.transaction(async (transaction) => {
    await targetUser.update({ password: hashedPassword }, { transaction });

    await logAdminAction({
      adminId: adminUser.id,
      targetUserId: targetUser.id,
      actionType: 'reset_password',
      summary: targetUser.id === adminUser.id ? '修改自己的密码' : '重置用户密码',
      metadata: { targetRole: targetUser.role, isSelf: targetUser.id === adminUser.id },
      transaction
    });
  });

  return targetUser;
};

module.exports = {
  logAdminAction,
  createAdminAccount,
  updateAdminStatus,
  deleteAdminAccount,
  markViolation,
  applyManualRestriction,
  adjustUserCredit,
  updateUserPasswordByAdmin
};
