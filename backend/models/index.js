const User = require('./User');
const Item = require('./Item');
const Order = require('./Order');
const Review = require('./Review');
const Message = require('./Message');
const Favorite = require('./Favorite');
const OrderReminderLog = require('./OrderReminderLog');
const Dispute = require('./Dispute');
const CreditRecord = require('./CreditRecord');
const UserRestriction = require('./UserRestriction');
const AdminActionLog = require('./AdminActionLog');

// 定义模型关联关系
User.hasMany(Item, { foreignKey: 'userId', as: 'items' });
Item.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'lenderId', as: 'lentOrders' });
User.hasMany(Order, { foreignKey: 'borrowerId', as: 'borrowedOrders' });
Order.belongsTo(User, { foreignKey: 'lenderId', as: 'lender' });
Order.belongsTo(User, { foreignKey: 'borrowerId', as: 'borrower' });

Item.hasMany(Order, { foreignKey: 'itemId', as: 'orders' });
Order.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

Order.hasMany(Review, { foreignKey: 'orderId', as: 'reviews' });
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

Order.hasMany(OrderReminderLog, { foreignKey: 'orderId', as: 'reminderLogs' });
OrderReminderLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
User.hasMany(OrderReminderLog, { foreignKey: 'receiverId', as: 'orderReminderLogs' });
OrderReminderLog.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

Order.hasOne(Dispute, { foreignKey: 'orderId', as: 'dispute' });
Dispute.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Item.hasMany(Dispute, { foreignKey: 'itemId', as: 'disputes' });
Dispute.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });
User.hasMany(Dispute, { foreignKey: 'borrowerId', as: 'borrowerDisputes' });
User.hasMany(Dispute, { foreignKey: 'lenderId', as: 'lenderDisputes' });
User.hasMany(Dispute, { foreignKey: 'initiatorId', as: 'initiatedDisputes' });
User.hasMany(Dispute, { foreignKey: 'respondentId', as: 'respondedDisputes' });
User.hasMany(Dispute, { foreignKey: 'adminId', as: 'resolvedDisputes' });
Dispute.belongsTo(User, { foreignKey: 'borrowerId', as: 'borrower' });
Dispute.belongsTo(User, { foreignKey: 'lenderId', as: 'lender' });
Dispute.belongsTo(User, { foreignKey: 'initiatorId', as: 'initiator' });
Dispute.belongsTo(User, { foreignKey: 'respondentId', as: 'respondent' });
Dispute.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

User.hasMany(CreditRecord, { foreignKey: 'userId', as: 'creditRecords' });
CreditRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(CreditRecord, { foreignKey: 'operatorId', as: 'operatedCreditRecords' });
CreditRecord.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });

User.hasMany(UserRestriction, { foreignKey: 'userId', as: 'restrictions' });
UserRestriction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserRestriction, { foreignKey: 'operatorId', as: 'restrictionOperatorLogs' });
UserRestriction.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });

User.hasMany(AdminActionLog, { foreignKey: 'adminId', as: 'adminActionLogs' });
AdminActionLog.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
User.hasMany(AdminActionLog, { foreignKey: 'targetUserId', as: 'targetedAdminActions' });
AdminActionLog.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });
Order.hasMany(AdminActionLog, { foreignKey: 'targetOrderId', as: 'adminActionLogs' });
AdminActionLog.belongsTo(Order, { foreignKey: 'targetOrderId', as: 'targetOrder' });
Dispute.hasMany(AdminActionLog, { foreignKey: 'targetDisputeId', as: 'adminActionLogs' });
AdminActionLog.belongsTo(Dispute, { foreignKey: 'targetDisputeId', as: 'targetDispute' });

module.exports = {
  User,
  Item,
  Order,
  Review,
  Message,
  Favorite,
  OrderReminderLog,
  Dispute,
  CreditRecord,
  UserRestriction,
  AdminActionLog
};
