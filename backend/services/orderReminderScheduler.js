const { Op } = require('sequelize');
const { Order, Item, Message, OrderReminderLog } = require('../models');

const REMINDER_INTERVAL_MS = 5 * 60 * 1000;
let reminderTimer = null;
let isRunning = false;

const buildReminderDate = (date = new Date()) => {
  return date.toISOString().slice(0, 10);
};

const sendReminderMessage = async ({ receiverId, content, orderId }) => {
  await Message.create({
    senderId: null,
    receiverId,
    content,
    type: 'system',
    relatedId: orderId,
    relatedType: 'order',
    isRead: false
  });
};

const createReminderIfNeeded = async ({ orderId, receiverId, reminderType, content, reminderDate }) => {
  const [log, created] = await OrderReminderLog.findOrCreate({
    where: {
      orderId,
      receiverId,
      reminderType,
      reminderDate
    },
    defaults: {
      orderId,
      receiverId,
      reminderType,
      reminderDate
    }
  });

  if (!created) {
    return false;
  }

  try {
    await sendReminderMessage({ receiverId, content, orderId });
    return true;
  } catch (error) {
    await log.destroy();
    throw error;
  }
};

const runOrderReminderScan = async () => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const reminderDate = buildReminderDate();
    const orders = await Order.findAll({
      where: {
        status: 'using',
        actualReturnTime: {
          [Op.is]: null
        }
      },
      include: [{
        model: Item,
        as: 'item',
        required: true,
        where: {
          transactionType: 'rent'
        }
      }]
    });

    let sentCount = 0;

    for (const order of orders) {
      sentCount += (await createReminderIfNeeded({
        orderId: order.id,
        receiverId: order.borrowerId,
        reminderType: 'daily-rent-pay',
        reminderDate,
        content: `今日租金提醒：${order.item.title} 仍在借用中，请按约及时付租金。`
      })) ? 1 : 0;

      sentCount += (await createReminderIfNeeded({
        orderId: order.id,
        receiverId: order.lenderId,
        reminderType: 'daily-rent-receive',
        reminderDate,
        content: `今日收租提醒：${order.item.title} 仍在借用中，请留意今日租金收取情况。`
      })) ? 1 : 0;
    }

    if (sentCount > 0) {
      console.log(`[order-reminder] Sent ${sentCount} rent reminder messages for ${reminderDate}.`);
    }
  } catch (error) {
    console.error('[order-reminder] Failed to run reminder scan:', error);
  } finally {
    isRunning = false;
  }
};

const startOrderReminderScheduler = () => {
  if (reminderTimer) {
    return;
  }

  runOrderReminderScan();
  reminderTimer = setInterval(runOrderReminderScan, REMINDER_INTERVAL_MS);
  console.log(`[order-reminder] Scheduler started. Interval: ${REMINDER_INTERVAL_MS / 1000}s`);
};

module.exports = {
  startOrderReminderScheduler,
  runOrderReminderScan
};
