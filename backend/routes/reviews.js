const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Review, Order, User, Item } = require('../models');

// 获取评价列表（支持多种查询方式）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, itemId, type = 'received' } = req.query;
    const offset = (page - 1) * limit;
    
    let where = {};
    
    if (userId) {
      where = type === 'received' 
        ? { revieweeId: userId }
        : { reviewerId: userId };
    } else {
      const currentUserId = req.user.id;
      where = type === 'received' 
        ? { revieweeId: currentUserId }
        : { reviewerId: currentUserId };
    }
    
    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: Item,
              as: 'item',
              attributes: ['id', 'title', 'images']
            }
          ]
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'reviewee',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const reviews = rows.map(review => ({
      ...review.toJSON(),
      isVisible: true
    }));
    
    res.json({
      data: reviews,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get reviews', error: error.message });
  }
});

// 获取评价详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: Item,
              as: 'item',
              attributes: ['id', 'title', 'images']
            }
          ]
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'reviewee',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const formattedReview = {
      ...review.toJSON(),
      isVisible: true
    };
    
    res.json({ review: formattedReview });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get review', error: error.message });
  }
});

// 创建评价
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, rating, content, images } = req.body;
    const reviewerId = req.user.id;
    
    // 检查订单是否存在且已完成
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed orders' });
    }
    
    // 确定评价对象
    const revieweeId = order.lenderId === reviewerId ? order.borrowerId : order.lenderId;
    
    // 检查是否已评价
    const existingReview = await Review.findOne({
      where: { orderId, reviewerId }
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'Already reviewed this order' });
    }
    
    const review = await Review.create({
      orderId,
      reviewerId,
      revieweeId,
      rating,
      content,
      images
    });
    
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: Item,
              as: 'item',
              attributes: ['id', 'title', 'images']
            }
          ]
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'reviewee',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    const formattedReview = {
      ...createdReview.toJSON(),
      isVisible: true
    };
    
    res.status(201).json({
      message: 'Review created successfully',
      review: formattedReview
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
});

// 获取物品的评价列表
router.get('/item/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const orders = await Order.findAll({
      where: { itemId },
      attributes: ['id']
    });
    
    const orderIds = orders.map(o => o.id);
    
    const { count, rows } = await Review.findAndCountAll({
      where: { orderId: orderIds },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: Item,
              as: 'item',
              attributes: ['id', 'title', 'images']
            }
          ]
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'reviewee',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const reviews = rows.map(review => ({
      ...review.toJSON(),
      isVisible: true
    }));
    
    res.json({
      data: reviews,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get item reviews', error: error.message });
  }
});

// 获取用户的评价列表
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type = 'received' } = req.query;
    const offset = (page - 1) * limit;
    
    const where = type === 'received' 
      ? { revieweeId: userId }
      : { reviewerId: userId };
    
    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: Item,
              as: 'item',
              attributes: ['id', 'title', 'images']
            }
          ]
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'reviewee',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const reviews = rows.map(review => ({
      ...review.toJSON(),
      isVisible: true
    }));
    
    res.json({
      data: reviews,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user reviews', error: error.message });
  }
});

// 获取订单的评价
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const reviews = await Review.findAll({
      where: { orderId },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: Item,
              as: 'item',
              attributes: ['id', 'title', 'images']
            }
          ]
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'reviewee',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    const formattedReviews = reviews.map(review => ({
      ...review.toJSON(),
      isVisible: true
    }));
    
    res.json({ review: formattedReviews.length > 0 ? formattedReviews[0] : null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order review', error: error.message });
  }
});

// 获取用户信用评分
router.get('/credit/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reviews = await Review.findAll({
      where: { revieweeId: userId }
    });
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    
    // 计算信用分（基础分 + 评价加权）
    const user = await User.findByPk(userId);
    const baseCredit = user ? user.creditScore : 100;
    const reviewBonus = Math.min(totalReviews * 2, 20); // 最多加20分
    const creditScore = Math.min(baseCredit + reviewBonus, 100);
    
    res.json({
      userId,
      creditScore,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get credit score', error: error.message });
  }
});

module.exports = router;
