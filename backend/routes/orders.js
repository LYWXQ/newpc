const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Order, Item, User } = require('../models');
const { Op } = require('sequelize');

// 生成订单号
const generateOrderNo = () => {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// 生成验证码
const generateVerificationCode = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

const normalizePickupCode = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[\s-]/g, '');

const isValidPickupCode = (value) => /^[A-Z0-9]{6}$/.test(value);

// 发送系统消息
const sendSystemMessage = async (receiverId, content, relatedId, relatedType, itemId = null) => {
  try {
    const Message = require('../models').Message;
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
  } catch (error) {
    console.error('Failed to send system message:', error);
  }
};

// 更新信誉分
const updateCreditScore = async (userId, change) => {
  try {
    const user = await User.findByPk(userId);
    if (user) {
      const newScore = Math.max(0, Math.min(150, user.creditScore + change));
      await user.update({ creditScore: newScore });
    }
  } catch (error) {
    console.error('Failed to update credit score:', error);
  }
};

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameDateTime = (valueA, valueB) => {
  if (!valueA || !valueB) return false;
  return new Date(valueA).getTime() === new Date(valueB).getTime();
};

const getOrderInclude = () => ([
  {
    model: Item,
    as: 'item',
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'avatar', 'creditScore', 'isVerified', 'phone', 'qq']
    }]
  },
  {
    model: User,
    as: 'lender',
    attributes: ['id', 'username', 'avatar', 'creditScore', 'phone', 'qq']
  },
  {
    model: User,
    as: 'borrower',
    attributes: ['id', 'username', 'avatar', 'creditScore', 'phone', 'qq']
  }
]);

const loadOrderById = async (id) => {
  return Order.findByPk(id, {
    include: getOrderInclude()
  });
};

const isRentOrder = (order) => order?.item?.transactionType === 'rent';
const isSellOrder = (order) => order?.item?.transactionType === 'sell';
const shouldRestoreItemAvailability = (order) => !isSellOrder(order);

const buildVerificationCodes = (order) => {
  const pickupCode = generateVerificationCode();
  const returnCode = isRentOrder(order) ? generateVerificationCode() : null;

  return {
    pickupCode,
    returnCode
  };
};

const resetVerificationProgress = {
  pickupCodeVerifiedAt: null,
  pickupConfirmedByLenderAt: null,
  returnCodeVerifiedAt: null,
  returnConfirmedByLenderAt: null,
  actualPickupTime: null,
  actualReturnTime: null,
  returnConfirmedTime: null,
  isEarlyReturn: false
};

const restoreItemAvailability = async (itemId) => {
  const item = await Item.findByPk(itemId);
  if (item) {
    await item.update({ status: 'available' });
  }
};

const completeOrderAndSyncItem = async (order, completedAt = new Date()) => {
  const updates = {
    status: 'completed',
    returnConfirmedTime: completedAt
  };

  if (!order.pickupConfirmedByLenderAt) {
    updates.pickupConfirmedByLenderAt = completedAt;
  }

  if (!order.actualPickupTime) {
    updates.actualPickupTime = completedAt;
  }

  await order.update(updates);

  if (shouldRestoreItemAvailability(order)) {
    await restoreItemAvailability(order.itemId);
  } else {
    await order.item.update({ status: 'offline' });
  }
};

// 获取订单统计
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalAsLender = await Order.count({
      where: { lenderId: userId }
    });

    const totalAsBorrower = await Order.count({
      where: { borrowerId: userId }
    });

    const pendingCount = await Order.count({
      where: {
        [Op.or]: [
          { lenderId: userId, status: 'pending' },
          { borrowerId: userId, status: 'pending' }
        ]
      }
    });

    const confirmedCount = await Order.count({
      where: {
        [Op.or]: [
          { lenderId: userId, status: 'confirmed' },
          { borrowerId: userId, status: 'confirmed' }
        ]
      }
    });

    const usingCount = await Order.count({
      where: {
        [Op.or]: [
          { lenderId: userId, status: 'using' },
          { borrowerId: userId, status: 'using' }
        ]
      }
    });

    const returnedCount = await Order.count({
      where: {
        [Op.or]: [
          { lenderId: userId, status: 'returned' },
          { borrowerId: userId, status: 'returned' }
        ]
      }
    });

    const completedCount = await Order.count({
      where: {
        [Op.or]: [
          { lenderId: userId, status: 'completed' },
          { borrowerId: userId, status: 'completed' }
        ]
      }
    });

    const buildRoleStats = async (roleField) => {
      const [pending, confirmed, using, returned, completed] = await Promise.all([
        Order.count({ where: { [roleField]: userId, status: 'pending' } }),
        Order.count({ where: { [roleField]: userId, status: 'confirmed' } }),
        Order.count({ where: { [roleField]: userId, status: 'using' } }),
        Order.count({ where: { [roleField]: userId, status: 'returned' } }),
        Order.count({ where: { [roleField]: userId, status: 'completed' } })
      ]);

      return {
        pending,
        confirmed,
        using,
        returned,
        completed,
        active: confirmed + using + returned
      };
    };

    const [lenderRoleStats, borrowerRoleStats] = await Promise.all([
      buildRoleStats('lenderId'),
      buildRoleStats('borrowerId')
    ]);

    res.json({
      totalAsLender,
      totalAsBorrower,
      pendingCount,
      confirmedCount,
      usingCount,
      returnedCount,
      completedCount,
      roleStats: {
        lender: lenderRoleStats,
        borrower: borrowerRoleStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order stats', error: error.message });
  }
});

// 获取订单列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role } = req.query;
    const userId = req.user.id;
    const pageNumber = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);
    const offset = (pageNumber - 1) * pageLimit;

    const where = {};

    if (role === 'lender') {
      where.lenderId = userId;
    } else if (role === 'borrower') {
      where.borrowerId = userId;
    } else {
      where[Op.or] = [
        { lenderId: userId },
        { borrowerId: userId }
      ];
    }

    if (status) {
      where.status = status.includes(',')
        ? { [Op.in]: status.split(',').map(value => value.trim()).filter(Boolean) }
        : status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'images', 'price', 'deposit', 'transactionType']
        },
        {
          model: User,
          as: 'lender',
          attributes: ['id', 'username', 'avatar', 'phone', 'qq']
        },
        {
          model: User,
          as: 'borrower',
          attributes: ['id', 'username', 'avatar', 'phone', 'qq']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset
    });

    res.json({
      orders,
      pagination: {
        total: count,
        page: pageNumber,
        limit: pageLimit,
        totalPages: Math.ceil(count / pageLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get orders', error: error.message });
  }
});

// 获取订单详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id && order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order', error: error.message });
  }
});

// 创建订单（交易请求）
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { itemId, startDate, endDate, note, pickupLocation, returnLocation } = req.body;
    const borrowerId = req.user.id;

    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ message: 'Item is not available' });
    }

    if (item.userId === borrowerId) {
      return res.status(400).json({ message: 'Cannot borrow your own item' });
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || !end) {
      return res.status(400).json({ message: 'Invalid order dates' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be later than start date' });
    }

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalPrice = Number(item.price) * totalDays;

    const order = await Order.create({
      orderNo: generateOrderNo(),
      itemId,
      lenderId: item.userId,
      borrowerId,
      startDate: start,
      endDate: end,
      totalDays,
      totalPrice,
      deposit: item.deposit,
      note,
      pickupLocation,
      returnLocation,
      status: 'pending',
      pendingConfirmation: false,
      pendingExtension: false,
      pickupCode: null,
      returnCode: null,
      ...resetVerificationProgress,
      cancelReason: null
    });

    await item.update({ status: 'reserved' });

    await sendSystemMessage(
      item.userId,
      `有新的交易请求：${item.title}，请确认交易时间、交还时间和交接地点。`,
      order.id,
      'order',
      item.id
    );

    const fullOrder = await loadOrderById(order.id);

    res.status(201).json({
      message: 'Order created successfully',
      order: fullOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// 卖方确认订单（可修改时间和地点）
router.put('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, pickupLocation, returnLocation } = req.body || {};
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can confirm order' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be confirmed' });
    }

    const updates = { status: 'confirmed' };

    const parsedStartDate = startDate ? parseDate(startDate) : null;
    const parsedEndDate = endDate ? parseDate(endDate) : null;

    if ((startDate && !parsedStartDate) || (endDate && !parsedEndDate)) {
      return res.status(400).json({ message: 'Invalid order dates' });
    }

    const nextStartDate = parsedStartDate || order.startDate;
    const nextEndDate = parsedEndDate || order.endDate;

    if (nextEndDate <= nextStartDate) {
      return res.status(400).json({ message: 'End date must be later than start date' });
    }

    const hasChanges = Boolean(
      (parsedStartDate && !isSameDateTime(parsedStartDate, order.startDate)) ||
      (parsedEndDate && !isSameDateTime(parsedEndDate, order.endDate)) ||
      (pickupLocation !== undefined && pickupLocation !== order.pickupLocation) ||
      (returnLocation !== undefined && returnLocation !== order.returnLocation)
    );

    if (parsedStartDate) updates.startDate = parsedStartDate;
    if (parsedEndDate) updates.endDate = parsedEndDate;
    if (pickupLocation !== undefined) updates.pickupLocation = pickupLocation;
    if (returnLocation !== undefined) updates.returnLocation = returnLocation;

    const totalDays = Math.max(1, Math.ceil((nextEndDate - nextStartDate) / (1000 * 60 * 60 * 24)));
    updates.totalDays = totalDays;
    updates.totalPrice = Number(order.item.price) * totalDays;
    updates.pendingConfirmation = hasChanges;

    if (hasChanges) {
      Object.assign(updates, {
        pickupCode: null,
        returnCode: null,
        ...resetVerificationProgress
      });
    } else {
      Object.assign(updates, {
        ...buildVerificationCodes(order),
        ...resetVerificationProgress
      });
    }

    await order.update(updates);

    if (hasChanges) {
      await sendSystemMessage(
        order.borrowerId,
        `卖方已修改交易信息：${order.item.title}，请确认新的交易时间、交还时间和地点。`,
        order.id,
        'order'
      );
    } else {
      const codeTip = updates.returnCode
        ? `取件码 ${updates.pickupCode}，归还码 ${updates.returnCode}`
        : `取件码 ${updates.pickupCode}`;
      await sendSystemMessage(
        order.lenderId,
        `交易已确认：${order.item.title}。请妥善保管并在交接时向买方出示${codeTip}。`,
        order.id,
        'order'
      );
      await sendSystemMessage(
        order.borrowerId,
        updates.returnCode
          ? `卖方已确认交易：${order.item.title}。请先向卖方获取取件码完成取件，归还时再向卖方获取归还码。`
          : `卖方已确认交易：${order.item.title}。请在交接时向卖方获取取件码并完成验码。`,
        order.id,
        'order'
      );
    }

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: hasChanges ? 'Order changes pending confirmation' : 'Order confirmed successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm order', error: error.message });
  }
});

// 买方确认修改
router.put('/:id/confirm-changes', authenticateToken, async (req, res) => {
  try {
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can confirm changes' });
    }

    if (order.status !== 'confirmed' || !order.pendingConfirmation) {
      return res.status(400).json({ message: 'No pending changes to confirm' });
    }

    const codes = buildVerificationCodes(order);

    await order.update({
      pendingConfirmation: false,
      ...codes,
      ...resetVerificationProgress
    });

    const codeTip = codes.returnCode
      ? `取件码 ${codes.pickupCode}，归还码 ${codes.returnCode}`
      : `取件码 ${codes.pickupCode}`;

    await sendSystemMessage(
      order.lenderId,
      `买方已确认修改：${order.item.title}。请妥善保管并在交接时向买方出示${codeTip}。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );
    await sendSystemMessage(
      order.borrowerId,
      codes.returnCode
        ? `交易信息已确认：${order.item.title}。请先向卖方获取取件码完成取件，归还时再向卖方获取归还码。`
        : `交易信息已确认：${order.item.title}。请在交接时向卖方获取取件码并完成验码。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Changes confirmed successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm changes', error: error.message });
  }
});

// 拒绝订单
router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can reject order' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be rejected' });
    }

    await order.update({ status: 'cancelled', cancelReason: reason || null });
    await restoreItemAvailability(order.itemId);

    await sendSystemMessage(
      order.borrowerId,
      `您的借用请求已被拒绝：${order.item.title}${reason ? `，原因：${reason}` : ''}`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Order rejected successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject order', error: error.message });
  }
});

// 买方提交取件码
router.put('/:id/pickup', authenticateToken, async (req, res) => {
  try {
    const inputPickupCode = normalizePickupCode(req.body.pickupCode);
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can submit pickup code' });
    }

    if (order.status !== 'confirmed' || order.pendingConfirmation) {
      return res.status(400).json({ message: 'Order cannot be picked up' });
    }

    if (order.pickupCodeVerifiedAt) {
      return res.status(400).json({ message: 'Pickup code already submitted' });
    }

    if (!inputPickupCode) {
      return res.status(400).json({ message: 'Pickup code is required' });
    }

    if (!isValidPickupCode(inputPickupCode)) {
      return res.status(400).json({ message: 'Pickup code format is invalid' });
    }

    const expectedPickupCode = normalizePickupCode(order.pickupCode);
    if (!expectedPickupCode || expectedPickupCode !== inputPickupCode) {
      return res.status(400).json({ message: 'Invalid pickup code' });
    }

    await order.update({
      pickupCodeVerifiedAt: new Date()
    });

    await sendSystemMessage(
      order.lenderId,
      `买方已提交取件码：${order.item.title}。请确认已完成交付。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );
    await sendSystemMessage(
      order.borrowerId,
      `您已提交取件码：${order.item.title}。等待卖方确认交付。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Pickup code submitted successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit pickup code', error: error.message });
  }
});

// 卖方确认已交付
router.put('/:id/confirm-pickup', authenticateToken, async (req, res) => {
  try {
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can confirm pickup' });
    }

    if (order.status !== 'confirmed' || order.pendingConfirmation) {
      return res.status(400).json({ message: 'Order cannot confirm pickup' });
    }

    if (!order.pickupCodeVerifiedAt) {
      return res.status(400).json({ message: 'Pickup code has not been submitted yet' });
    }

    if (order.pickupConfirmedByLenderAt) {
      return res.status(400).json({ message: 'Pickup already confirmed by lender' });
    }

    const confirmedAt = new Date();

    await order.update({
      pickupConfirmedByLenderAt: confirmedAt,
      actualPickupTime: confirmedAt,
      status: isRentOrder(order) ? 'using' : 'completed',
      returnConfirmedTime: isRentOrder(order) ? null : confirmedAt
    });

    if (isRentOrder(order)) {
      await order.item.update({ status: 'rented' });
      await sendSystemMessage(
        order.lenderId,
        `您已确认交付物品：${order.item.title}。订单已进入使用中。`,
        order.id,
        'order'
      );
      await sendSystemMessage(
        order.borrowerId,
        `卖方已确认交付：${order.item.title}。订单已进入使用中，请保持联系并按时归还。`,
        order.id,
        'order'
      );
    } else {
      await completeOrderAndSyncItem(order, confirmedAt);
      await updateCreditScore(order.borrowerId, 5);
      await updateCreditScore(order.lenderId, 2);
      await sendSystemMessage(
        order.lenderId,
        `您已确认交付物品：${order.item.title}。订单已完成。`,
        order.id,
        'order'
      );
      await sendSystemMessage(
        order.borrowerId,
        `卖方已确认交付：${order.item.title}。订单已完成，双方现在可以互相评价了。`,
        order.id,
        'order'
      );
    }

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Pickup confirmed by lender successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm pickup by lender', error: error.message });
  }
});

// 卖方更新归还时间和地点
router.put('/:id/update-return-info', authenticateToken, async (req, res) => {
  try {
    const { returnLocation, returnTime } = req.body;
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can update return info' });
    }

    if (order.status !== 'using') {
      return res.status(400).json({ message: 'Order is not in use' });
    }

    const updates = {};
    if (returnLocation !== undefined) updates.returnLocation = returnLocation;

    let returnTimeMessage = '';
    if (returnTime !== undefined) {
      const parsedReturnTime = parseDate(returnTime);
      if (!parsedReturnTime) {
        return res.status(400).json({ message: 'Invalid return time' });
      }
      updates.endDate = parsedReturnTime;
      returnTimeMessage = `，计划交还时间：${parsedReturnTime.toLocaleString('zh-CN')}`;
    }

    await order.update(updates);

    await sendSystemMessage(
      order.borrowerId,
      `卖方已更新归还信息：${order.item.title}${returnTimeMessage}，请按新的约定完成交还。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Return info updated successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update return info', error: error.message });
  }
});

// 买方提交归还码
router.put('/:id/return', authenticateToken, async (req, res) => {
  try {
    const inputReturnCode = normalizePickupCode(req.body.returnCode);
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can submit return code' });
    }

    if (!isRentOrder(order)) {
      return res.status(400).json({ message: 'Only rent orders can be returned with code' });
    }

    if (order.status !== 'using') {
      return res.status(400).json({ message: 'Order cannot be returned' });
    }

    if (!order.pickupConfirmedByLenderAt) {
      return res.status(400).json({ message: 'Pickup has not been confirmed yet' });
    }

    if (order.returnCodeVerifiedAt) {
      return res.status(400).json({ message: 'Return code already submitted' });
    }

    if (!inputReturnCode) {
      return res.status(400).json({ message: 'Return code is required' });
    }

    if (!isValidPickupCode(inputReturnCode)) {
      return res.status(400).json({ message: 'Return code format is invalid' });
    }

    const expectedReturnCode = normalizePickupCode(order.returnCode);
    if (!expectedReturnCode || expectedReturnCode !== inputReturnCode) {
      return res.status(400).json({ message: 'Invalid return code' });
    }

    await order.update({
      returnCodeVerifiedAt: new Date()
    });

    await sendSystemMessage(
      order.lenderId,
      `买方已提交归还码：${order.item.title}。请确认已收回物品。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );
    await sendSystemMessage(
      order.borrowerId,
      `您已提交归还码：${order.item.title}。等待卖方确认收回。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Return code submitted successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit return code', error: error.message });
  }
});

// 卖方确认已收回
router.put('/:id/confirm-return-receipt', authenticateToken, async (req, res) => {
  try {
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can confirm return receipt' });
    }

    if (!isRentOrder(order)) {
      return res.status(400).json({ message: 'Only rent orders require return confirmation' });
    }

    if (order.status !== 'using') {
      return res.status(400).json({ message: 'Order cannot confirm return receipt' });
    }

    if (!order.returnCodeVerifiedAt) {
      return res.status(400).json({ message: 'Return code has not been submitted yet' });
    }

    if (order.returnConfirmedByLenderAt) {
      return res.status(400).json({ message: 'Return already confirmed by lender' });
    }

    const confirmedAt = new Date();
    const isEarlyReturn = confirmedAt.getTime() < new Date(order.endDate).getTime();

    await order.update({
      status: 'returned',
      returnConfirmedByLenderAt: confirmedAt,
      actualReturnTime: confirmedAt,
      isEarlyReturn
    });

    await sendSystemMessage(
      order.lenderId,
      `您已确认收回物品：${order.item.title}。订单待最终完成${isEarlyReturn ? '，本次为提前归还' : ''}。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );
    await sendSystemMessage(
      order.borrowerId,
      `卖方已确认收回：${order.item.title}。订单待最终完成${isEarlyReturn ? '，本次为提前归还' : ''}。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Return receipt confirmed successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm return receipt', error: error.message });
  }
});

// 卖方确认完成
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can complete order' });
    }

    if (order.status !== 'returned') {
      return res.status(400).json({ message: 'Order cannot be completed' });
    }

    await completeOrderAndSyncItem(order);

    await updateCreditScore(order.borrowerId, 5);
    await updateCreditScore(order.lenderId, 2);

    await sendSystemMessage(
      order.borrowerId,
      `订单已完成：${order.item.title}。卖方已完成确认，双方现在可以互相评价了。`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );
    await sendSystemMessage(
      order.lenderId,
      `您已完成订单：${order.item.title}。${shouldRestoreItemAvailability(order) ? '物品状态已恢复为可借。' : '物品状态已更新为下架。'}`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Order completed successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete order', error: error.message });
  }
});

// 取消订单
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.borrowerId !== req.user.id && order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel order' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    await order.update({ status: 'cancelled', cancelReason: reason || null });
    await restoreItemAvailability(order.itemId);

    const otherUserId = req.user.id === order.borrowerId ? order.lenderId : order.borrowerId;
    await sendSystemMessage(
      otherUserId,
      `订单已被取消：${order.item.title}${reason ? `，原因：${reason}` : ''}`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Order cancelled successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

// 延期申请
router.put('/:id/extend', authenticateToken, async (req, res) => {
  try {
    const { endDate } = req.body;
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can request extension' });
    }

    if (order.status !== 'using') {
      return res.status(400).json({ message: 'Only in-use orders can be extended' });
    }

    const newEndDate = parseDate(endDate);
    if (!newEndDate) {
      return res.status(400).json({ message: 'Invalid end date' });
    }

    const originalEndDate = new Date(order.endDate);

    if (newEndDate <= originalEndDate) {
      return res.status(400).json({ message: 'New end date must be later than current' });
    }

    await order.update({
      endDate: newEndDate,
      pendingExtension: true
    });

    const daysExtended = Math.ceil((newEndDate - originalEndDate) / (1000 * 60 * 60 * 24));
    const extensionCost = Number(order.item.price) * daysExtended;

    await sendSystemMessage(
      order.lenderId,
      `买方申请延期：${order.item.title}，延期${daysExtended}天，费用¥${extensionCost}`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Extension request sent',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request extension', error: error.message });
  }
});

// 确认延期
router.put('/:id/confirm-extension', authenticateToken, async (req, res) => {
  try {
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can confirm extension' });
    }

    if (!order.pendingExtension) {
      return res.status(400).json({ message: 'No pending extension request' });
    }

    const totalDays = Math.max(1, Math.ceil((new Date(order.endDate) - new Date(order.startDate)) / (1000 * 60 * 60 * 24)));
    const totalPrice = Number(order.item.price) * totalDays;

    await order.update({
      pendingExtension: false,
      totalDays,
      totalPrice
    });

    await sendSystemMessage(
      order.borrowerId,
      `延期申请已通过：${order.item.title}`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Extension confirmed successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm extension', error: error.message });
  }
});

// 拒绝延期
router.put('/:id/reject-extension', authenticateToken, async (req, res) => {
  try {
    const order = await loadOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can reject extension' });
    }

    if (!order.pendingExtension) {
      return res.status(400).json({ message: 'No pending extension request' });
    }

    await order.update({ pendingExtension: false });

    await sendSystemMessage(
      order.borrowerId,
      `延期申请已被拒绝：${order.item.title}`,
      order.id,
      'order',
      order.itemId || order.item?.id || null
    );

    const refreshedOrder = await loadOrderById(order.id);

    res.json({
      message: 'Extension rejected successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject extension', error: error.message });
  }
});

module.exports = router;
