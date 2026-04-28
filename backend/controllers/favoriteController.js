const { Favorite, Item, User } = require('../models');

// 添加收藏
const addFavorite = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.id;

    if (!itemId) {
      return res.status(400).json({ message: '物品ID不能为空' });
    }

    // 检查物品是否存在
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    // 检查是否已收藏
    const existingFavorite = await Favorite.findOne({
      where: { userId, itemId }
    });

    if (existingFavorite) {
      return res.status(400).json({ message: '已收藏该物品' });
    }

    // 创建收藏记录
    const favorite = await Favorite.create({ userId, itemId });

    res.status(201).json({
      message: '收藏成功',
      favorite: {
        id: favorite.id,
        userId: favorite.userId,
        itemId: favorite.itemId,
        createdAt: favorite.createdAt
      }
    });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({ message: '添加收藏失败', error: error.message });
  }
};

// 取消收藏
const removeFavorite = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({
      where: { userId, itemId }
    });

    if (!favorite) {
      return res.status(404).json({ message: '未收藏该物品' });
    }

    await favorite.destroy();

    res.json({ message: '取消收藏成功' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({ message: '取消收藏失败', error: error.message });
  }
};

// 批量取消收藏
const batchRemoveFavorites = async (req, res) => {
  try {
    const { itemIds } = req.body;
    const userId = req.user.id;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: '请选择要取消收藏的物品' });
    }

    const result = await Favorite.destroy({
      where: {
        userId,
        itemId: itemIds
      }
    });

    res.json({
      message: `成功取消收藏 ${result} 个物品`,
      removedCount: result
    });
  } catch (error) {
    console.error('批量取消收藏失败:', error);
    res.status(500).json({ message: '批量取消收藏失败', error: error.message });
  }
};

// 获取收藏列表
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Item,
          as: 'item',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      favorites,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ message: '获取收藏列表失败', error: error.message });
  }
};

// 检查收藏状态
const checkFavoriteStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({
      where: { userId, itemId }
    });

    res.json({
      isFavorite: !!favorite,
      favoriteId: favorite ? favorite.id : null
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({ message: '检查收藏状态失败', error: error.message });
  }
};

// 获取收藏数量
const getFavoriteCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Favorite.count({
      where: { userId }
    });

    res.json({ count });
  } catch (error) {
    console.error('获取收藏数量失败:', error);
    res.status(500).json({ message: '获取收藏数量失败', error: error.message });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  batchRemoveFavorites,
  getFavorites,
  checkFavoriteStatus,
  getFavoriteCount
};
