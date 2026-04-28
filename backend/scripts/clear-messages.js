/**
 * 清空指定用户的所有消息
 * 用法: node scripts/clear-messages.js user user1
 */

const { Message, User } = require('../models');
const { Op } = require('sequelize');

async function clearUserMessages() {
  const usernames = process.argv.slice(2);
  
  if (usernames.length === 0) {
    console.log('Usage: node scripts/clear-messages.js <username1> <username2> ...');
    process.exit(1);
  }
  
  try {
    // 查找用户ID
    const users = await User.findAll({
      where: {
        username: {
          [Op.in]: usernames
        }
      }
    });
    
    if (users.length === 0) {
      console.log('Users not found:', usernames);
      process.exit(1);
    }
    
    const userIds = users.map(u => u.id);
    console.log('Found users:', users.map(u => ({ id: u.id, username: u.username })));
    
    // 删除这些用户参与的所有消息
    const deletedCount = await Message.destroy({
      where: {
        [Op.or]: [
          { senderId: { [Op.in]: userIds } },
          { receiverId: { [Op.in]: userIds } }
        ]
      }
    });
    
    console.log(`Successfully deleted ${deletedCount} messages`);
    console.log('Cleared users:', usernames);
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing messages:', error);
    process.exit(1);
  }
}

clearUserMessages();
