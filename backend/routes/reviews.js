const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Review, Order, User, Item } = require('../models');
const { createCreditRecord } = require('../services/creditService');

const formatReview = (review) => ({
  ...review.toJSON(),
  isVisible: true
});

const getReviewInclude = () => ([
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
]);

const buildPagination = (count, page, limit) => ({
  total: count,
  page,
  limit,
  totalPages: Math.ceil(count / limit)
});

// 获取评价列表（支持多种查询方式）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, itemId, type = 'received' } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);
    const offset = (pageNumber - 1) * pageLimit;

    let where = {};

    if (itemId) {
      const orders = await Order.findAll({
        where: { itemId },
        attributes: ['id']
      });
      where.orderId = orders.map(order => order.id);
    } else if (userId) {
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
      include: getReviewInclude(),
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset
    });

    res.json({
      reviews: rows.map(formatReview),
      pagination: buildPagination(count, pageNumber, pageLimit)
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
      include: getReviewInclude()
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ review: formatReview(review) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get review', error: error.message });
  }
});

// 创建评价
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, rating, content, images } = req.body;
    const reviewerId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed orders' });
    }

    if (order.lenderId !== reviewerId && order.borrowerId !== reviewerId) {
      return res.status(403).json({ message: 'Not authorized to review this order' });
    }

    const revieweeId = order.lenderId === reviewerId ? order.borrowerId : order.lenderId;

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

    const numericRating = Number(rating);
    const scoreDelta = numericRating >= 5 ? 2 : numericRating >= 4 ? 1 : numericRating >= 3 ? 0 : numericRating >= 2 ? -2 : -4;

    if (scoreDelta !== 0) {
      await createCreditRecord({
        userId: revieweeId,
        delta: scoreDelta,
        sourceType: 'review',
        sourceId: review.id,
        reason: `订单评价 ${numericRating} 星`,
        operatorId: reviewerId,
        metadata: { orderId }
      });
    }

    const createdReview = await Review.findByPk(review.id, {
      include: getReviewInclude()
    });

    res.status(201).json({
      message: 'Review created successfully',
      review: formatReview(createdReview)
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
    const pageNumber = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);
    const offset = (pageNumber - 1) * pageLimit;

    const orders = await Order.findAll({
      where: { itemId },
      attributes: ['id']
    });

    const orderIds = orders.map(order => order.id);

    const { count, rows } = await Review.findAndCountAll({
      where: { orderId: orderIds },
      include: getReviewInclude(),
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset
    });

    res.json({
      reviews: rows.map(formatReview),
      pagination: buildPagination(count, pageNumber, pageLimit)
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
    const pageNumber = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);
    const offset = (pageNumber - 1) * pageLimit;

    const where = type === 'received'
      ? { revieweeId: userId }
      : { reviewerId: userId };

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: getReviewInclude(),
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset
    });

    res.json({
      reviews: rows.map(formatReview),
      pagination: buildPagination(count, pageNumber, pageLimit)
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
      include: getReviewInclude(),
      order: [['createdAt', 'ASC']]
    });

    const formattedReviews = reviews.map(formatReview);
    const myReview = formattedReviews.find(review => review.reviewerId === req.user.id) || null;

    res.json({
      reviews: formattedReviews,
      myReview,
      canReview: !myReview
    });
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
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / totalReviews
      : 0;

    const user = await User.findByPk(userId);
    const baseCredit = user ? user.creditScore : 100;
    const reviewBonus = Math.min(totalReviews * 2, 20);
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
