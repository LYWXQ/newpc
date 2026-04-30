const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Message, User } = require('../models');
const { Op } = require('sequelize');

// 获取系统消息列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type = 'system', page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;
    
    // 只处理系统消息
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
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
});

// 获取未读系统消息数量
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await Message.count({
      where: {
        receiverId: req.user.id,
        isRead: false,
        type: 'system'
      }
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get unread count', error: error.message });
  }
});

// 发送系统消息（内部使用，由服务器触发）
router.post('/system', async (req, res) => {
  try {
    const { receiverId, content, relatedId, relatedType } = req.body;
    
    // 检查接收者是否存在
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // 系统消息不关联具体发送用户
    const senderId = null;
    
    const message = await Message.create({
      senderId,
      receiverId,
      content,
      type: 'system',
      relatedId,
      relatedType,
      isRead: false
    });
    
    res.status(201).json({
      message: 'System message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send system message error:', error);
    res.status(500).json({ message: 'Failed to send system message', error: error.message });
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

// 删除消息
router.delete('/:id', authenticateToken, async (req, res) => {
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
});

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

module.exports = router;