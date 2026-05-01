const { CreditRecord, User, UserRestriction } = require('../models');

const MIN_CREDIT_SCORE = 0;
const MAX_CREDIT_SCORE = 150;
const CREDIT_RESTRICTION_THRESHOLD = 60;

const clampScore = (score) => Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, score));
const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isRestrictionActive = (until) => Boolean(until && new Date(until).getTime() > Date.now());

const syncViolationState = async (user, reason) => {
  const shouldBeViolation = user.creditScore < CREDIT_RESTRICTION_THRESHOLD;
  const nextTradeRestrictedUntil = shouldBeViolation && !isRestrictionActive(user.tradeRestrictedUntil)
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : user.tradeRestrictedUntil;
  const nextPublishRestrictedUntil = shouldBeViolation && !isRestrictionActive(user.publishRestrictedUntil)
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : user.publishRestrictedUntil;

  await user.update({
    isViolationUser: shouldBeViolation,
    violationMarkedAt: shouldBeViolation ? (user.violationMarkedAt || new Date()) : null,
    violationReason: shouldBeViolation ? (reason || user.violationReason || '信誉分低于交易阈值') : null,
    tradeRestrictedUntil: nextTradeRestrictedUntil,
    publishRestrictedUntil: nextPublishRestrictedUntil
  });

  return user;
};

const createCreditRecord = async ({ userId, delta, sourceType, sourceId = null, reason = null, operatorId = null, metadata = null }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const scoreBefore = user.creditScore;
  const scoreAfter = clampScore(scoreBefore + delta);

  await user.update({ creditScore: scoreAfter });
  await syncViolationState(user, reason);

  return CreditRecord.create({
    userId,
    changeType: delta >= 0 ? 'increase' : 'decrease',
    sourceType,
    sourceId,
    delta,
    scoreBefore,
    scoreAfter,
    reason,
    operatorId,
    metadata
  });
};

const applyRestriction = async ({ userId, restrictionType, sourceType, sourceId = null, reason = null, hours = 24, operatorId = null, metadata = null, endsAt = null }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const finalEndsAt = toDate(endsAt) || new Date(Date.now() + hours * 60 * 60 * 1000);
  const fieldName = restrictionType === 'trade' ? 'tradeRestrictedUntil' : 'publishRestrictedUntil';
  const currentUntil = toDate(user[fieldName]);
  const nextUntil = !currentUntil || currentUntil.getTime() < finalEndsAt.getTime() ? finalEndsAt : currentUntil;

  await user.update({
    [fieldName]: nextUntil,
    isViolationUser: true,
    violationMarkedAt: user.violationMarkedAt || new Date(),
    violationReason: reason || user.violationReason || '管理员处罚'
  });

  return UserRestriction.create({
    userId,
    restrictionType,
    sourceType,
    sourceId,
    reason,
    startsAt: new Date(),
    endsAt: nextUntil,
    isActive: true,
    operatorId,
    metadata
  });
};

const applyRestrictions = async ({ userId, reason, sourceType, sourceId = null, hours = 24, operatorId = null, metadata = null }) => {
  const [tradeRestriction, publishRestriction] = await Promise.all([
    applyRestriction({ userId, restrictionType: 'trade', sourceType, sourceId, reason, hours, operatorId, metadata }),
    applyRestriction({ userId, restrictionType: 'publish', sourceType, sourceId, reason, hours, operatorId, metadata })
  ]);

  return { tradeRestriction, publishRestriction };
};

const ensureUserCanTrade = (user) => {
  if (!user) throw new Error('User not found');
  if (user.role !== 'user') throw new Error('后台账号不参与普通交易');
  if (user.status !== 'active') throw new Error('当前账号状态不可交易');
  if (user.isViolationUser) throw new Error('当前账号已被标记为违规，暂不可交易');
  if (user.creditScore < CREDIT_RESTRICTION_THRESHOLD) throw new Error('当前信誉分过低，暂不可交易');
  if (isRestrictionActive(user.tradeRestrictedUntil)) {
    throw new Error(`当前账号交易受限，截止至 ${new Date(user.tradeRestrictedUntil).toLocaleString('zh-CN')}`);
  }
};

const ensureUserCanPublish = (user) => {
  if (!user) throw new Error('User not found');
  if (user.role !== 'user') throw new Error('后台账号不参与普通发布');
  if (user.status !== 'active') throw new Error('当前账号状态不可发布');
  if (user.isViolationUser) throw new Error('当前账号已被标记为违规，暂不可发布');
  if (user.creditScore < CREDIT_RESTRICTION_THRESHOLD) throw new Error('当前信誉分过低，暂不可发布');
  if (isRestrictionActive(user.publishRestrictedUntil)) {
    throw new Error(`当前账号发布受限，截止至 ${new Date(user.publishRestrictedUntil).toLocaleString('zh-CN')}`);
  }
};

module.exports = {
  CREDIT_RESTRICTION_THRESHOLD,
  MIN_CREDIT_SCORE,
  MAX_CREDIT_SCORE,
  createCreditRecord,
  applyRestriction,
  applyRestrictions,
  ensureUserCanTrade,
  ensureUserCanPublish,
  isRestrictionActive,
  syncViolationState
};
