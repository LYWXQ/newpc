const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Order, Item, User } = require('../models');
const { Op } = require('sequelize');

// 生成订单号
const generateOrderNo = () => {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
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
    
    const inProgressCount = await Order.count({
      where: {
        [Op.or]: [
          { lenderId: userId, status: 'in_progress' },
          { borrowerId: userId, status: 'in_progress' }
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
      inProgressCount,
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

// 创建订单
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { itemId, startDate, endDate, note } = req.body;
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
      status: 'pending'
    });
    
    await item.update({ status: 'rented' });
    
    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// 同意订单
router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can approve order' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be approved' });
    }
    
    await order.update({ status: 'approved' });
    
    res.json({
      message: 'Order approved successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve order', error: error.message });
  }
});

// 拒绝订单
router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Only lender can reject order' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be rejected' });
    }
    
    await order.update({ status: 'rejected', cancelReason: reason });
    
    const item = await Item.findByPk(order.itemId);
    await item.update({ status: 'available' });
    
    res.json({
      message: 'Order rejected successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject order', error: error.message });
  }
});

// 确认取货
router.put('/:id/pickup', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can confirm pickup' });
    }
    
    if (order.status !== 'approved') {
      return res.status(400).json({ message: 'Order cannot be picked up' });
    }
    
    await order.update({ status: 'in_progress' });
    
    res.json({
      message: 'Pickup confirmed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm pickup', error: error.message });
  }
});

// 完成订单
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'Only borrower can complete order' });
    }
    
    if (order.status !== 'in_progress') {
      return res.status(400).json({ message: 'Order cannot be completed' });
    }
    
    await order.update({ status: 'completed' });
    
    const item = await Item.findByPk(order.itemId);
    await item.update({ status: 'available' });
    
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
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.borrowerId !== req.user.id && order.lenderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel order' });
    }
    
    if (order.status !== 'pending' && order.status !== 'approved') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }
    
    await order.update({ status: 'cancelled', cancelReason: reason });
    
    const item = await Item.findByPk(order.itemId);
    await item.update({ status: 'available' });
    
    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

module.exports = router;
