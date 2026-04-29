const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Order, Item, User } = require('../models');
const { Op } = require('sequelize');

// 生成订单号
const generateOrderNo = () => {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// 生成取件码
const generatePickupCode = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

// 发送系统消息
const sendSystemMessage = async (receiverId, content, relatedId, relatedType) => {
  try {
    const Message = require('../models').Message;
    await Message.create({
      senderId: 0,
      receiverId,
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
    
    const completedCount = await Order.count({
      where: {
        [Op.or]: [
          { lenderId: userId, status: 'completed' },
          { borrowerId: userId, status: 'completed' }
        ]
      }
    });
    
    res.json({
      totalAsLender,
      totalAsBorrower,
      pendingCount,
      confirmedCount,
      usingCount,
      completedCount
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
    const offset = (page - 1) * limit;
    
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
      where.status = status;
    }
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'images', 'price', 'deposit']
        },
        {
          model: User,
          as: 'lender',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'borrower',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get orders', error: error.message });
  }
});

// 获取订单详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Item,
          as: 'item',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar']
          }]
        },
        {
          model: User,
          as: 'lender',
          attributes: ['id', 'username', 'avatar', 'creditScore']
        },
        {
          model: User,
          as: 'borrower',
          attributes: ['id', 'username', 'avatar', 'creditScore']
        }
      ]
    });
    
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
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = item.price * totalDays;
    
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
      status: 'pending'
    });
    
    await item.update({ status: 'reserved' });
    
    // 发送系统消息通知卖方
    await sendSystemMessage(
      item.userId,
      `有新的借用请求：${item.title}，请及时处理`,
      order.id,
      'order'
    );
    
    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// 卖方确认订单（可修改时间和地点）
router.put('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, pickupLocation, returnLocation } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
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
    
    // 如果卖方修改了时间或地点，需要买方确认
    const hasChanges = (startDate && startDate !== order.startDate.toISOString()) ||
                       (endDate && endDate !== order.endDate.toISOString()) ||
                       (pickupLocation && pickupLocation !== order.pickupLocation) ||
                       (returnLocation && returnLocation !== order.returnLocation);
    
    if (hasChanges) {
      // 标记需要买方确认
      updates.pendingConfirmation = true;
      if (startDate) updates.startDate = new Date(startDate);
      if (endDate) updates.endDate = new Date(endDate);
      if (pickupLocation) updates.pickupLocation = pickupLocation;
      if (returnLocation) updates.returnLocation = returnLocation;
    }
    
    await order.update(updates);
    
    // 发送系统消息
    if (hasChanges) {
      await sendSystemMessage(
        order.borrowerId,
        `卖方已修改交易信息，请确认新的时间和地点：${order.item.title}`,
        order.id,
        'order'
      );
    } else {
      await sendSystemMessage(
        order.borrowerId,
        `卖方已确认您的借用请求：${order.item.title}`,
        order.id,
        'order'
      );
    }
    
    res.json({
      message: hasChanges ? 'Order changes pending confirmation' : 'Order confirmed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm order', error: error.message });
  }
});

// 买方确认修改
router.put('/:id/confirm-changes', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can confirm changes' });
    }
    
    if (order.status !== 'confirmed' || !order.pendingConfirmation) {
      return res.status(400).json({ message: 'No pending changes to confirm' });
    }
    
    await order.update({ pendingConfirmation: false });
    
    // 生成取件码
    const pickupCode = generatePickupCode();
    await order.update({ pickupCode });
    
    // 发送系统消息通知卖方
    await sendSystemMessage(
      order.lenderId,
      `买方已确认修改，交易继续进行：${order.item.title}`,
      order.id,
      'order'
    );
    
    res.json({
      message: 'Changes confirmed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm changes', error: error.message });
  }
});

// 拒绝订单
router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can reject order' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be rejected' });
    }
    
    await order.update({ status: 'cancelled', cancelReason: reason });
    
    const item = await Item.findByPk(order.itemId);
    await item.update({ status: 'available' });
    
    // 发送系统消息
    await sendSystemMessage(
      order.borrowerId,
      `您的借用请求已被拒绝：${order.item.title}，原因：${reason}`,
      order.id,
      'order'
    );
    
    res.json({
      message: 'Order rejected successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject order', error: error.message });
  }
});

// 确认交接（输入取件码）
router.put('/:id/pickup', authenticateToken, async (req, res) => {
  try {
    const { pickupCode } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // 卖方或买方都可以确认交接
    if (order.borrowerId !== req.user.id && order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to confirm pickup' });
    }
    
    if (order.status !== 'confirmed' || order.pendingConfirmation) {
      return res.status(400).json({ message: 'Order cannot be picked up' });
    }
    
    // 验证取件码
    if (order.pickupCode !== pickupCode) {
      return res.status(400).json({ message: 'Invalid pickup code' });
    }
    
    await order.update({ status: 'using' });
    
    // 发送系统消息
    if (req.user.id === order.borrowerId) {
      await sendSystemMessage(
        order.lenderId,
        `物品已交接给买方：${order.item.title}`,
        order.id,
        'order'
      );
    } else {
      await sendSystemMessage(
        order.borrowerId,
        `物品交接成功，开始使用：${order.item.title}`,
        order.id,
        'order'
      );
    }
    
    res.json({
      message: 'Pickup confirmed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm pickup', error: error.message });
  }
});

// 临期提醒确认（确认归还时间和地点）
router.put('/:id/confirm-return', authenticateToken, async (req, res) => {
  try {
    const { returnLocation, returnTime } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can confirm return' });
    }
    
    if (order.status !== 'using') {
      return res.status(400).json({ message: 'Order is not in use' });
    }
    
    const updates = {};
    if (returnLocation) updates.returnLocation = returnLocation;
    if (returnTime) updates.endDate = new Date(returnTime);
    
    await order.update(updates);
    
    // 发送系统消息通知卖方
    await sendSystemMessage(
      order.lenderId,
      `买方确认归还信息，请注意接收：${order.item.title}`,
      order.id,
      'order'
    );
    
    res.json({
      message: 'Return confirmed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm return', error: error.message });
  }
});

// 确认归还完成
router.put('/:id/return', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // 卖方或买方都可以确认归还
    if (order.borrowerId !== req.user.id && order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to confirm return' });
    }
    
    if (order.status !== 'using') {
      return res.status(400).json({ message: 'Order cannot be returned' });
    }
    
    await order.update({ status: 'returned' });
    
    // 发送系统消息
    if (req.user.id === order.borrowerId) {
      await sendSystemMessage(
        order.lenderId,
        `买方已归还物品，请确认：${order.item.title}`,
        order.id,
        'order'
      );
    } else {
      await sendSystemMessage(
        order.borrowerId,
        `物品已归还，订单完成：${order.item.title}`,
        order.id,
        'order'
      );
      
      // 卖方确认归还时，增加双方信誉分
      await updateCreditScore(order.borrowerId, 5);
      await updateCreditScore(order.lenderId, 2);
      
      const item = await Item.findByPk(order.itemId);
      await item.update({ status: 'available' });
      
      await order.update({ status: 'completed' });
    }
    
    res.json({
      message: 'Return confirmed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm return', error: error.message });
  }
});

// 完成订单（买方确认）
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can complete order' });
    }
    
    if (order.status !== 'using' && order.status !== 'returned') {
      return res.status(400).json({ message: 'Order cannot be completed' });
    }
    
    await order.update({ status: 'completed' });
    
    const item = await Item.findByPk(order.itemId);
    await item.update({ status: 'available' });
    
    // 增加双方信誉分
    await updateCreditScore(order.borrowerId, 5);
    await updateCreditScore(order.lenderId, 2);
    
    // 发送系统消息
    await sendSystemMessage(
      order.lenderId,
      `订单已完成：${order.item.title}`,
      order.id,
      'order'
    );
    
    res.json({
      message: 'Order completed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete order', error: error.message });
  }
});

// 取消订单
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.borrowerId !== req.user.id && order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel order' });
    }
    
    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Completed order cannot be cancelled' });
    }
    
    // 如果订单已经在使用中，取消会影响信誉分
    if (order.status === 'using') {
      // 扣除取消方信誉分
      if (req.user.id === order.borrowerId) {
        await updateCreditScore(order.borrowerId, -10);
      } else {
        await updateCreditScore(order.lenderId, -10);
      }
    }
    
    await order.update({ status: 'cancelled', cancelReason: reason });
    
    const item = await Item.findByPk(order.itemId);
    await item.update({ status: 'available' });
    
    // 发送系统消息
    const otherUserId = req.user.id === order.borrowerId ? order.lenderId : order.borrowerId;
    await sendSystemMessage(
      otherUserId,
      `订单已被取消：${order.item.title}，原因：${reason}`,
      order.id,
      'order'
    );
    
    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

// 延期申请
router.put('/:id/extend', authenticateToken, async (req, res) => {
  try {
    const { endDate } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can request extension' });
    }
    
    if (order.status !== 'using') {
      return res.status(400).json({ message: 'Only in-use orders can be extended' });
    }
    
    const newEndDate = new Date(endDate);
    const originalEndDate = new Date(order.endDate);
    
    if (newEndDate <= originalEndDate) {
      return res.status(400).json({ message: 'New end date must be later than current' });
    }
    
    await order.update({ 
      endDate: newEndDate,
      pendingExtension: true 
    });
    
    // 计算延期费用
    const daysExtended = Math.ceil((newEndDate - originalEndDate) / (1000 * 60 * 60 * 24));
    const extensionCost = order.item.price * daysExtended;
    
    // 发送系统消息
    await sendSystemMessage(
      order.lenderId,
      `买方申请延期：${order.item.title}，延期${daysExtended}天，费用¥${extensionCost}`,
      order.id,
      'order'
    );
    
    res.json({
      message: 'Extension request sent',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request extension', error: error.message });
  }
});

// 确认延期
router.put('/:id/confirm-extension', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can confirm extension' });
    }
    
    if (!order.pendingExtension) {
      return res.status(400).json({ message: 'No pending extension request' });
    }
    
    // 更新订单
    await order.update({ pendingExtension: false });
    
    // 计算并更新费用
    const originalEndDate = new Date(order.createdAt);
    const newEndDate = new Date(order.endDate);
    const totalDays = Math.ceil((newEndDate - originalEndDate) / (1000 * 60 * 60 * 24));
    const totalPrice = order.item.price * totalDays;
    
    await order.update({ totalDays, totalPrice });
    
    // 发送系统消息
    await sendSystemMessage(
      order.borrowerId,
      `延期申请已通过：${order.item.title}`,
      order.id,
      'order'
    );
    
    res.json({
      message: 'Extension confirmed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm extension', error: error.message });
  }
});

// 拒绝延期
router.put('/:id/reject-extension', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can reject extension' });
    }
    
    if (!order.pendingExtension) {
      return res.status(400).json({ message: 'No pending extension request' });
    }
    
    // 恢复原时间
    await order.update({ pendingExtension: false });
    
    // 发送系统消息
    await sendSystemMessage(
      order.borrowerId,
      `延期申请已被拒绝：${order.item.title}`,
      order.id,
      'order'
    );
    
    res.json({
      message: 'Extension rejected successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject extension', error: error.message });
  }
});

module.exports = router;