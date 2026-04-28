const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取收藏列表
router.get('/', favoriteController.getFavorites);

// 获取收藏数量
router.get('/count', favoriteController.getFavoriteCount);

// 检查收藏状态
router.get('/check/:itemId', favoriteController.checkFavoriteStatus);

// 添加收藏
router.post('/', favoriteController.addFavorite);

// 批量取消收藏 - 必须放在 /:itemId 之前，避免被解析为 itemId="batch"
router.delete('/batch', favoriteController.batchRemoveFavorites);

// 取消收藏
router.delete('/:itemId', favoriteController.removeFavorite);

module.exports = router;
