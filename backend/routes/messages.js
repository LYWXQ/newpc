const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Message, User, Item } = require('../models');
const { Op, Sequelize } = require('sequelize');

// 获取消息列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;
    
    // 系统消息：只返回 type='system' 的消息
    if (type === 'system') {
      const where = {
        type: 'system',
        [Op.or]: [
          { receiverId: userId },
          { senderId: userId }
        ]
      };
      
      const messages = await Message.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'username', 'avatar']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return res.json({
        messages: messages.rows,
        pagination: {
          total: messages.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(messages.count / limit)
        }
      });
    }
    
    // 聊天消息：按物品分组，返回每个会话的最新消息
    if (type === 'chat') {
      // 获取所有聊天消息（text 和 image 类型）
      const where = {
        type: { [Op.in]: ['text', 'image'] },
        [Op.or]: [
          { receiverId: userId },
          { senderId: userId }
        ]
      };
      
      // 获取所有相关的消息，按物品和用户分组
      const messages = await Message.findAll({
        where,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'username', 'avatar']
          },
          {
            model: Item,
            as: 'item',
            attributes: ['id', 'title', 'images']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      // 按物品和对话对象分组，获取每个会话的最新消息
      const conversationMap = new Map();
      
      messages.forEach(msg => {
        // 确定对话对象（不是当前用户的那个）
        const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
        
        // 生成会话唯一标识：itemId + otherUserId
        // 对于没有itemId的消息，统一使用0表示，确保同一用户的消息在一个会话中
        const itemId = msg.itemId || 0;
        const key = `${itemId}_${otherUserId}`;
        
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            id: msg.id,
            itemId: itemId,
            item: msg.item,
            otherUserId: otherUserId,
            otherUser: otherUser,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: 0,
            type: 'chat'
          });
        }
        
        // 统计未读消息数（发给当前用户且未读的）
        if (msg.receiverId === userId && !msg.isRead) {
          const conv = conversationMap.get(key);
          conv.unreadCount++;
        }
      });
      
      // 转换为数组并按最后消息时间排序
      const conversationList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      
      // 分页
      const total = conversationList.length;
      const paginatedList = conversationList.slice(offset, offset + parseInt(limit));
      
      return res.json({
        messages: paginatedList,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
    }
    
    // 默认：返回所有消息
    const where = {
      [Op.or]: [
        { receiverId: userId },
        { senderId: userId }
      ]
    };
    
    const messages = await Message.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      messages: messages.rows,
      pagination: {
        total: messages.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(messages.count / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
});

// 获取未读消息数量
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await Message.count({
      where: {
        receiverId: req.user.id,
        isRead: false
      }
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get unread count', error: error.message });
  }
});

// 获取与某个用户的聊天记录
router.get('/chat/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 50, itemId } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const where = {
      [Op.or]: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    };
    
    // 如果指定了itemId，只查询该物品相关的消息
    if (itemId) {
      where.itemId = parseInt(itemId);
    }
    
    const messages = await Message.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'images']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // 标记消息为已读
    await Message.update(
      { isRead: true },
      {
        where: {
          senderId: userId,
          receiverId: currentUserId,
          isRead: false,
          ...(itemId && { itemId: parseInt(itemId) })
        }
      }
    );
    
    res.json({
      messages: messages.rows,
      pagination: {
        total: messages.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(messages.count / limit)
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Failed to get chat messages', error: error.message });
  }
});

// 发送消息
router.post('/', authenticateToken, async (req, res) => {
  try {
    const receiverId = parseInt(req.body.receiverId);
    const { content, type = 'text', itemId, relatedId, relatedType } = req.body;
    const senderId = req.user.id;
    
    // 检查接收者是否存在
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // 不能给自己发消息
    if (senderId === parseInt(receiverId)) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }
    
    // 如果指定了itemId，检查物品是否存在
    if (itemId) {
      const item = await Item.findByPk(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
    }
    
    const message = await Message.create({
      senderId,
      receiverId,
      itemId: itemId || null,
      content,
      type,
      relatedId,
      relatedType,
      isRead: false
    });
    
    // 返回完整消息信息
    const fullMessage = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'images']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: fullMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// 标记消息为已读
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // 只能标记发给自己的消息
    if (message.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }
    
    await message.update({ isRead: true });
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark message as read', error: error.message });
  }
});

// 删除消息 (支持PUT和DELETE)
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // 只能删除自己发送或接收的消息
    if (message.senderId !== req.user.id && message.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }
    
    await message.destroy();
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
};

router.delete('/:id', authenticateToken, deleteMessage);
router.put('/:id/delete', authenticateToken, deleteMessage);

// 标记所有消息为已读
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Message.update(
      { isRead: true },
      {
        where: {
          receiverId: userId,
          isRead: false
        }
      }
    );
    
    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all as read', error: error.message });
  }
});

// 清空指定用户的所有消息（管理员接口）
router.delete('/clear-users', authenticateToken, async (req, res) => {
  try {
    // 检查是否是管理员（这里简化处理，实际应该检查用户角色）
    // 暂时允许任何用户清空自己的消息，或者指定用户名
    const { usernames } = req.body;
    
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ message: 'Please provide usernames array' });
    }
    
    // 查找用户ID
    const users = await User.findAll({
      where: {
        username: {
          [Op.in]: usernames
        }
      }
    });
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }
    
    const userIds = users.map(u => u.id);
    
    // 删除这些用户参与的所有消息
    const deletedCount = await Message.destroy({
      where: {
        [Op.or]: [
          { senderId: { [Op.in]: userIds } },
          { receiverId: { [Op.in]: userIds } }
        ]
      }
    });
    
    res.json({
      message: 'Messages cleared successfully',
      deletedCount,
      clearedUsers: usernames
    });
  } catch (error) {
    console.error('Clear messages error:', error);
    res.status(500).json({ message: 'Failed to clear messages', error: error.message });
  }
});

module.exports = router;
