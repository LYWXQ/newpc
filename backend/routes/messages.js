const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Message, User, Item } = require('../models');
const { Op } = require('sequelize');

const DEFAULT_GROUP_KEY = 'others';
const DEFAULT_GROUP_TITLE = '其他通知';

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
};

const buildBaseWhere = ({ userId, type = 'system' }) => {
  const where = {
    receiverId: userId,
    type
  };

  return where;
};

const applyGroupFilter = (where, { itemId, groupKey }) => {
  const parsedItemId = parsePositiveInt(itemId);

  if (parsedItemId) {
    where.itemId = parsedItemId;
    return;
  }

  if (groupKey === DEFAULT_GROUP_KEY) {
    where.itemId = {
      [Op.is]: null
    };
  }
};

const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit)
});

const buildGroupFromMessage = (message) => {
  const groupKey = message.itemId ? `item:${message.itemId}` : DEFAULT_GROUP_KEY;

  return {
    groupKey,
    itemId: message.itemId || null,
    item: message.item ? {
      id: message.item.id,
      title: message.item.title,
      images: message.item.images,
      price: message.item.price,
      deposit: message.item.deposit,
      transactionType: message.item.transactionType
    } : null,
    title: message.item?.title || DEFAULT_GROUP_TITLE,
    latestMessageId: message.id,
    lastMessage: message.content,
    lastMessageTime: message.createdAt,
    unreadCount: message.isRead ? 0 : 1,
    totalCount: 1
  };
};

const buildMessageGroups = (messages) => {
  const groups = new Map();

  for (const message of messages) {
    const groupKey = message.itemId ? `item:${message.itemId}` : DEFAULT_GROUP_KEY;
    const existingGroup = groups.get(groupKey);

    if (!existingGroup) {
      groups.set(groupKey, buildGroupFromMessage(message));
      continue;
    }

    existingGroup.totalCount += 1;
    if (!message.isRead) {
      existingGroup.unreadCount += 1;
    }
  }

  return Array.from(groups.values());
};

const buildMessageDetailInclude = () => ([
  {
    model: Item,
    as: 'item',
    attributes: ['id', 'title', 'images', 'price', 'deposit', 'transactionType']
  },
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
]);

// 获取按物品聚合的系统消息列表
router.get('/groups', authenticateToken, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page) || 1;
    const limit = parsePositiveInt(req.query.limit) || 20;
    const where = buildBaseWhere({ userId: req.user.id, type: 'system' });

    const messages = await Message.findAll({
      where,
      include: [{
        model: Item,
        as: 'item',
        attributes: ['id', 'title', 'images', 'price', 'deposit', 'transactionType'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    const groups = buildMessageGroups(messages);
    const startIndex = (page - 1) * limit;
    const paginatedGroups = groups.slice(startIndex, startIndex + limit);

    res.json({
      groups: paginatedGroups,
      pagination: buildPagination(groups.length, page, limit)
    });
  } catch (error) {
    console.error('Get message groups error:', error);
    res.status(500).json({ message: 'Failed to get message groups', error: error.message });
  }
});

// 获取系统消息列表或某个分组下的消息明细
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page) || 1;
    const limit = parsePositiveInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const where = buildBaseWhere({
      userId: req.user.id,
      type: req.query.type || 'system'
    });

    applyGroupFilter(where, {
      itemId: req.query.itemId,
      groupKey: req.query.groupKey
    });

    const messages = await Message.findAndCountAll({
      where,
      include: buildMessageDetailInclude(),
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      messages: messages.rows,
      pagination: buildPagination(messages.count, page, limit)
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
    const { receiverId, content, relatedId, relatedType, itemId } = req.body;

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const senderId = null;

    const message = await Message.create({
      senderId,
      receiverId,
      itemId: itemId || null,
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

// 按分组批量标记为已读
router.put('/read-by-group', authenticateToken, async (req, res) => {
  try {
    const where = buildBaseWhere({ userId: req.user.id, type: 'system' });
    where.isRead = false;

    applyGroupFilter(where, {
      itemId: req.body?.itemId,
      groupKey: req.body?.groupKey
    });

    const [updatedCount] = await Message.update(
      { isRead: true },
      { where }
    );

    res.json({ message: 'Group messages marked as read', updatedCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark group messages as read', error: error.message });
  }
});

// 标记消息为已读
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    await message.update({ isRead: true });

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark message as read', error: error.message });
  }
});

// 删除消息分组
router.delete('/by-group', authenticateToken, async (req, res) => {
  try {
    const where = buildBaseWhere({ userId: req.user.id, type: 'system' });

    applyGroupFilter(where, {
      itemId: req.body?.itemId,
      groupKey: req.body?.groupKey
    });

    const deletedCount = await Message.destroy({ where });

    res.json({ message: 'Message group deleted successfully', deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message group', error: error.message });
  }
});

// 删除单条消息
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

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
          isRead: false,
          type: 'system'
        }
      }
    );

    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all messages as read', error: error.message });
  }
});

module.exports = router;
