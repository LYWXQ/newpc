const User = require('./User');
const Item = require('./Item');
const Order = require('./Order');
const Review = require('./Review');
const Message = require('./Message');
const Favorite = require('./Favorite');

// 定义模型关联关系
User.hasMany(Item, { foreignKey: 'userId', as: 'items' });
Item.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'lenderId', as: 'lentOrders' });
User.hasMany(Order, { foreignKey: 'borrowerId', as: 'borrowedOrders' });
Order.belongsTo(User, { foreignKey: 'lenderId', as: 'lender' });
Order.belongsTo(User, { foreignKey: 'borrowerId', as: 'borrower' });

Item.hasMany(Order, { foreignKey: 'itemId', as: 'orders' });
Order.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

Order.hasOne(Review, { foreignKey: 'orderId', as: 'review' });
Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(Review, { foreignKey: 'reviewerId', as: 'givenReviews' });
User.hasMany(Review, { foreignKey: 'revieweeId', as: 'receivedReviews' });
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'revieweeId', as: 'reviewee' });

// 消息关联
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// 消息与物品的关联
Item.hasMany(Message, { foreignKey: 'itemId', as: 'messages' });
Message.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// 收藏关联
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Item.hasMany(Favorite, { foreignKey: 'itemId', as: 'favorites' });
Favorite.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

module.exports = {
  User,
  Item,
  Order,
  Review,
  Message,
  Favorite
};
