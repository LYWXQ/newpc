const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Order, Item, Favorite, Dispute } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DELETION_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const PENDING_LOGIN_TOKEN_TTL = '10m';
const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'using', 'returned'];
const ACTIVE_ITEM_STATUSES = ['reserved', 'rented'];

const DELETION_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  DELETED: 'deleted'
};

const ALLOWED_USER_ROLES = ['user', 'admin', 'super_admin'];
const normalizeUserRole = (role) => ALLOWED_USER_ROLES.includes(role) ? role : 'user';

const serializeUser = (user) => ({
  id: user.id,
  studentId: user.studentId,
  username: user.username,
  avatar: user.avatar,
  phone: user.phone,
  qq: user.qq,
  email: user.email,
  school: user.school,
  major: user.major,
  creditScore: user.creditScore,
  isViolationUser: user.isViolationUser,
  violationMarkedAt: user.violationMarkedAt,
  violationReason: user.violationReason,
  tradeRestrictedUntil: user.tradeRestrictedUntil,
  publishRestrictedUntil: user.publishRestrictedUntil,
  isVerified: user.isVerified,
  role: normalizeUserRole(user.role),
  status: user.status,
  deletionStatus: user.deletionStatus,
  deletionRequestedAt: user.deletionRequestedAt,
  deletionDeadlineAt: user.deletionDeadlineAt,
  deletionCancelledAt: user.deletionCancelledAt,
  anonymizedAt: user.anonymizedAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const isValidQQ = (value) => /^[1-9][0-9]{4,14}$/.test(String(value || '').trim());

const buildDeletionDeadline = (requestedAt = new Date()) => {
  const baseDate = new Date(requestedAt);
  return new Date(baseDate.getTime() + DELETION_GRACE_PERIOD_MS);
};

const isPendingDeletion = (user) => user?.deletionStatus === DELETION_STATUS.PENDING;

const isDeletedUser = (user) => user?.deletionStatus === DELETION_STATUS.DELETED || user?.status === DELETION_STATUS.DELETED;

const isDeletionExpired = (user, now = new Date()) => {
  if (!isPendingDeletion(user) || !user.deletionDeadlineAt) {
    return false;
  }

  return new Date(user.deletionDeadlineAt).getTime() <= now.getTime();
};

const buildPendingLoginToken = (user) => jwt.sign({
  userId: user.id,
  purpose: 'resolve-deletion-login',
  deletionRequestedAt: user.deletionRequestedAt ? new Date(user.deletionRequestedAt).getTime() : null,
  deletionDeadlineAt: user.deletionDeadlineAt ? new Date(user.deletionDeadlineAt).getTime() : null
}, JWT_SECRET, { expiresIn: PENDING_LOGIN_TOKEN_TTL });

const verifyPendingLoginToken = (token) => {
  const payload = jwt.verify(token, JWT_SECRET);

  if (payload.purpose !== 'resolve-deletion-login') {
    throw new Error('无效的登录确认凭证');
  }

  return payload;
};

const checkUserHasActiveBusiness = async (userId) => {
  const activeOrderCount = await Order.count({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { lenderId: userId },
            { borrowerId: userId }
          ]
        },
        {
          [Op.or]: [
            { status: { [Op.in]: ACTIVE_ORDER_STATUSES } },
            { pendingConfirmation: true },
            { pendingExtension: true }
          ]
        }
      ]
    }
  });

  const activeItemCount = await Item.count({
    where: {
      userId,
      status: { [Op.in]: ACTIVE_ITEM_STATUSES }
    }
  });

  const activeDisputeCount = await Dispute.count({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { lenderId: userId },
            { borrowerId: userId }
          ]
        },
        {
          status: {
            [Op.in]: ['open', 'awaiting_counterparty', 'under_review']
          }
        }
      ]
    }
  });

  return {
    hasActiveBusiness: activeOrderCount > 0 || activeItemCount > 0 || activeDisputeCount > 0,
    activeOrderCount,
    activeItemCount,
    activeDisputeCount
  };
};

const scheduleUserDeletion = async (user) => {
  const deletionRequestedAt = new Date();
  const deletionDeadlineAt = buildDeletionDeadline(deletionRequestedAt);

  await user.update({
    deletionStatus: DELETION_STATUS.PENDING,
    deletionRequestedAt,
    deletionDeadlineAt,
    deletionCancelledAt: null,
    anonymizedAt: null
  });

  return user;
};

const cancelUserDeletion = async (user) => {
  await user.update({
    deletionStatus: DELETION_STATUS.NONE,
    deletionRequestedAt: null,
    deletionDeadlineAt: null,
    deletionCancelledAt: new Date()
  });

  return user;
};

const anonymizeUserAccount = async (userOrId) => {
  const user = typeof userOrId === 'object'
    ? userOrId
    : await User.findByPk(userOrId);

  if (!user) {
    return null;
  }

  if (isDeletedUser(user)) {
    return user;
  }

  const activeBusiness = await checkUserHasActiveBusiness(user.id);
  if (activeBusiness.hasActiveBusiness) {
    const error = new Error('用户仍存在进行中的业务，无法完成注销');
    error.code = 'DELETION_BLOCKED_BY_ACTIVE_BUSINESS';
    error.detail = activeBusiness;
    throw error;
  }

  const anonymizedAt = new Date();
  const anonymizedUsername = `已注销用户${user.id}`;
  const hashedPassword = await bcrypt.hash(`deleted:${user.id}:${anonymizedAt.toISOString()}`, 10);

  await Favorite.destroy({
    where: { userId: user.id }
  });

  await Item.update({
    status: 'offline'
  }, {
    where: { userId: user.id }
  });

  await user.update({
    studentId: null,
    username: anonymizedUsername,
    password: hashedPassword,
    avatar: null,
    phone: null,
    qq: null,
    email: null,
    school: null,
    major: null,
    isVerified: false,
    role: 'user',
    isViolationUser: false,
    violationMarkedAt: null,
    violationReason: null,
    tradeRestrictedUntil: null,
    publishRestrictedUntil: null,
    status: DELETION_STATUS.DELETED,
    deletionStatus: DELETION_STATUS.DELETED,
    anonymizedAt
  });

  return user;
};

const processExpiredDeletionForUser = async (user) => {
  if (!isDeletionExpired(user)) {
    return { processed: false, user };
  }

  const updatedUser = await anonymizeUserAccount(user);
  return { processed: true, user: updatedUser };
};

const sweepExpiredDeletionUsers = async () => {
  const users = await User.findAll({
    where: {
      deletionStatus: DELETION_STATUS.PENDING,
      deletionDeadlineAt: {
        [Op.lte]: new Date()
      }
    }
  });

  const results = [];
  for (const user of users) {
    try {
      await anonymizeUserAccount(user);
      results.push({ userId: user.id, success: true });
    } catch (error) {
      results.push({ userId: user.id, success: false, message: error.message });
    }
  }

  return results;
};

module.exports = {
  ACTIVE_ITEM_STATUSES,
  ACTIVE_ORDER_STATUSES,
  DELETION_STATUS,
  anonymizeUserAccount,
  buildPendingLoginToken,
  cancelUserDeletion,
  checkUserHasActiveBusiness,
  isDeletedUser,
  isDeletionExpired,
  isPendingDeletion,
  isValidQQ,
  processExpiredDeletionForUser,
  scheduleUserDeletion,
  serializeUser,
  sweepExpiredDeletionUsers,
  normalizeUserRole,
  verifyPendingLoginToken
};
