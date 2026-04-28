const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Item, Order, Review, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

// 获取热门推荐
router.get('/hot', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 基于浏览量和订单量计算热门度
    const items = await Item.findAll({
      where: {
        status: 'available'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'creditScore']
        }
      ],
      order: [
        ['viewCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    res.json({
      items,
      type: 'hot'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get hot recommendations', error: error.message });
  }
});

// 获取个性化推荐（需要登录）
router.get('/personalized', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    
    // 获取用户历史订单中的物品分类
    const userOrders = await Order.findAll({
      where: {
        borrowerId: userId
      },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['category']
        }
      ]
    });
    
    // 提取用户感兴趣的分类
    const interestedCategories = [...new Set(
      userOrders.map(order => order.item?.category).filter(Boolean)
    )];
    
    // 获取用户已浏览的物品ID
    const userItemIds = userOrders.map(order => order.itemId);
    
    let recommendedItems;
    
    if (interestedCategories.length > 0) {
      // 基于用户兴趣分类推荐
      recommendedItems = await Item.findAll({
        where: {
          status: 'available',
          category: {
            [Op.in]: interestedCategories
          },
          id: {
            [Op.notIn]: userItemIds.length > 0 ? userItemIds : [0]
          },
          userId: {
            [Op.ne]: userId
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar', 'creditScore']
          }
        ],
        order: [
          ['viewCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit)
      });
    }
    
    // 如果个性化推荐不足，补充热门物品
    if (!recommendedItems || recommendedItems.length < parseInt(limit)) {
      const existingIds = recommendedItems ? recommendedItems.map(item => item.id) : [];
      const additionalItems = await Item.findAll({
        where: {
          status: 'available',
          id: {
            [Op.notIn]: [...existingIds, ...userItemIds].length > 0 ? [...existingIds, ...userItemIds] : [0]
          },
          userId: {
            [Op.ne]: userId
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar', 'creditScore']
          }
        ],
        order: [
          ['viewCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit) - (recommendedItems ? recommendedItems.length : 0)
      });
      
      recommendedItems = recommendedItems ? [...recommendedItems, ...additionalItems] : additionalItems;
    }
    
    res.json({
      items: recommendedItems,
      type: 'personalized',
      basedOn: interestedCategories
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get personalized recommendations', error: error.message });
  }
});

// 获取相似物品推荐
router.get('/similar/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 5 } = req.query;
    
    // 获取当前物品信息
    const currentItem = await Item.findByPk(itemId);
    
    if (!currentItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // 基于相同分类和价格范围推荐相似物品
    const similarItems = await Item.findAll({
      where: {
        status: 'available',
        category: currentItem.category,
        id: {
          [Op.ne]: itemId
        },
        price: {
          [Op.between]: [currentItem.price * 0.5, currentItem.price * 1.5]
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'creditScore']
        }
      ],
      order: [
        ['viewCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    res.json({
      items: similarItems,
      type: 'similar',
      basedOn: {
        category: currentItem.category,
        priceRange: [currentItem.price * 0.5, currentItem.price * 1.5]
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get similar items', error: error.message });
  }
});

// 获取最新发布的物品
router.get('/latest', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const items = await Item.findAll({
      where: {
        status: 'available'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'creditScore']
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    res.json({
      items,
      type: 'latest'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get latest items', error: error.message });
  }
});

// 获取高信用用户的物品
router.get('/trusted', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const items = await Item.findAll({
      where: {
        status: 'available'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'creditScore'],
          where: {
            creditScore: {
              [Op.gte]: 80
            }
          }
        }
      ],
      order: [
        ['viewCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    res.json({
      items,
      type: 'trusted'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get trusted items', error: error.message });
  }
});

module.exports = router;
