const { Dispute, Message, Order, User, Item } = require('../models');
const { createCreditRecord, applyRestrictions } = require('./creditService');
const { logAdminAction } = require('./adminService');

const DISPUTE_RESTRICTION_HOURS = 24;

const sendSystemMessage = async (receiverId, content, relatedId, relatedType, itemId = null) => {
  await Message.create({
    senderId: null,
    receiverId,
    itemId,
    content,
    type: 'system',
    relatedId,
    relatedType,
    isRead: false
  });
};

const getDisputeInclude = () => ([
  {
    model: Order,
    as: 'order',
    include: [{ model: Item, as: 'item' }]
  },
  { model: User, as: 'borrower', attributes: ['id', 'username', 'avatar', 'creditScore', 'isViolationUser'] },
  { model: User, as: 'lender', attributes: ['id', 'username', 'avatar', 'creditScore', 'isViolationUser'] },
  { model: User, as: 'initiator', attributes: ['id', 'username', 'avatar'] },
  { model: User, as: 'respondent', attributes: ['id', 'username', 'avatar'] },
  { model: User, as: 'admin', attributes: ['id', 'username', 'role'] }
]);

const loadDisputeById = (id) => Dispute.findByPk(id, { include: getDisputeInclude() });

const ensureOrderCanCreateDispute = (order) => {
  if (!order) throw new Error('Order not found');
  if (order.status !== 'confirmed' && order.status !== 'using' && order.status !== 'returned') {
    throw new Error('当前订单状态不可申请纠纷');
  }
};

const createDispute = async ({ order, initiatorId, statement, images = [] }) => {
  ensureOrderCanCreateDispute(order);

  const existing = await Dispute.findOne({ where: { orderId: order.id } });
  if (existing) {
    throw new Error('该订单已存在纠纷记录');
  }

  const isBorrower = order.borrowerId === initiatorId;
  const respondentId = isBorrower ? order.lenderId : order.borrowerId;

  const dispute = await Dispute.create({
    orderId: order.id,
    itemId: order.itemId,
    borrowerId: order.borrowerId,
    lenderId: order.lenderId,
    initiatorId,
    respondentId,
    status: 'awaiting_counterparty',
    initiatorStatement: statement,
    initiatorImages: images,
    respondentStatement: null,
    respondentImages: []
  });

  await sendSystemMessage(
    respondentId,
    `订单 ${order.orderNo} 已发起纠纷，请尽快补充说明与证据。`,
    dispute.id,
    'dispute',
    order.itemId
  );

  return loadDisputeById(dispute.id);
};

const respondToDispute = async ({ dispute, userId, statement, images = [] }) => {
  if (!dispute) throw new Error('Dispute not found');
  if (dispute.respondentId !== userId) throw new Error('当前用户无权回应该纠纷');
  if (dispute.status !== 'awaiting_counterparty' && dispute.status !== 'open') {
    throw new Error('当前纠纷不可补充回应');
  }

  await dispute.update({
    respondentStatement: statement,
    respondentImages: images,
    status: 'under_review'
  });

  await sendSystemMessage(
    dispute.initiatorId,
    `订单 ${dispute.order?.orderNo || dispute.orderId} 的纠纷已收到对方说明，等待管理员处理。`,
    dispute.id,
    'dispute',
    dispute.itemId
  );

  return loadDisputeById(dispute.id);
};

const resolveDispute = async ({ dispute, adminId, verdict, lossAmount = 0, resolutionNote, borrowerPenaltyScore = 0, lenderPenaltyScore = 0, restrictionHours = DISPUTE_RESTRICTION_HOURS }) => {
  if (!dispute) throw new Error('Dispute not found');
  if (dispute.status === 'resolved') throw new Error('该纠纷已处理');

  const resolvedAt = new Date();
  const restrictionEndsAt = new Date(Date.now() + restrictionHours * 60 * 60 * 1000);

  await dispute.update({
    adminId,
    status: 'resolved',
    verdict,
    lossAmount,
    resolutionNote,
    borrowerPenaltyScore,
    lenderPenaltyScore,
    restrictionEndsAt,
    resolvedAt
  });

  if (borrowerPenaltyScore > 0) {
    await createCreditRecord({
      userId: dispute.borrowerId,
      delta: -Math.abs(borrowerPenaltyScore),
      sourceType: 'dispute',
      sourceId: dispute.id,
      reason: resolutionNote || '纠纷裁决扣分',
      operatorId: adminId,
      metadata: { verdict, role: 'borrower', lossAmount }
    });
    await applyRestrictions({
      userId: dispute.borrowerId,
      reason: resolutionNote || '纠纷处罚限制',
      sourceType: 'dispute',
      sourceId: dispute.id,
      hours: restrictionHours,
      operatorId: adminId,
      metadata: { verdict, role: 'borrower' }
    });
  }

  if (lenderPenaltyScore > 0) {
    await createCreditRecord({
      userId: dispute.lenderId,
      delta: -Math.abs(lenderPenaltyScore),
      sourceType: 'dispute',
      sourceId: dispute.id,
      reason: resolutionNote || '纠纷裁决扣分',
      operatorId: adminId,
      metadata: { verdict, role: 'lender', lossAmount }
    });
    await applyRestrictions({
      userId: dispute.lenderId,
      reason: resolutionNote || '纠纷处罚限制',
      sourceType: 'dispute',
      sourceId: dispute.id,
      hours: restrictionHours,
      operatorId: adminId,
      metadata: { verdict, role: 'lender' }
    });
  }

  await logAdminAction({
    adminId,
    targetDisputeId: dispute.id,
    targetOrderId: dispute.orderId,
    actionType: 'resolve_dispute',
    summary: '处理订单纠纷',
    detail: resolutionNote || null,
    metadata: { verdict, borrowerPenaltyScore, lenderPenaltyScore, lossAmount, restrictionHours }
  });

  await sendSystemMessage(
    dispute.borrowerId,
    `订单 ${dispute.order?.orderNo || dispute.orderId} 的纠纷已处理，请查看裁决结果。`,
    dispute.id,
    'dispute',
    dispute.itemId
  );
  await sendSystemMessage(
    dispute.lenderId,
    `订单 ${dispute.order?.orderNo || dispute.orderId} 的纠纷已处理，请查看裁决结果。`,
    dispute.id,
    'dispute',
    dispute.itemId
  );

  return loadDisputeById(dispute.id);
};

module.exports = {
  DISPUTE_RESTRICTION_HOURS,
  getDisputeInclude,
  loadDisputeById,
  ensureOrderCanCreateDispute,
  createDispute,
  respondToDispute,
  resolveDispute
};
