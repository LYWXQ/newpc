const { Op } = require('sequelize');
const { Dispute, Order } = require('../models');
const { createDispute, loadDisputeById, respondToDispute } = require('../services/disputeService');

const MAX_DISPUTE_STATEMENT_LENGTH = 500;
const MAX_DISPUTE_IMAGES = 6;

const validateDisputePayload = (statement, images = []) => {
  const normalizedStatement = String(statement || '').trim();

  if (!normalizedStatement) {
    throw new Error('纠纷说明不能为空');
  }

  if (normalizedStatement.length > MAX_DISPUTE_STATEMENT_LENGTH) {
    throw new Error('纠纷说明不能超过500字');
  }

  if (!Array.isArray(images)) {
    throw new Error('纠纷图片参数无效');
  }

  if (images.length > MAX_DISPUTE_IMAGES) {
    throw new Error('最多上传6张纠纷图片');
  }

  for (const image of images) {
    if (typeof image !== 'string') {
      throw new Error('纠纷图片参数无效');
    }
  }

  return {
    statement: normalizedStatement,
    images
  };
};

const isBadRequestError = (message = '') => [
  '纠纷说明不能为空',
  '纠纷说明不能超过500字',
  '纠纷图片参数无效',
  '最多上传6张纠纷图片',
  '纠纷图片路径无效'
].includes(message);

const getOrderDispute = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.borrowerId !== req.user.id && order.lenderId !== req.user.id) {
      return res.status(403).json({ message: '无权查看该订单纠纷' });
    }

    const dispute = await Dispute.findOne({ where: { orderId: order.id } });
    if (!dispute) {
      return res.status(404).json({ message: '当前订单暂无纠纷' });
    }

    const fullDispute = await loadDisputeById(dispute.id);
    res.json({ dispute: fullDispute });
  } catch (error) {
    res.status(500).json({ message: '获取订单纠纷失败', error: error.message });
  }
};

const createOrderDispute = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.borrowerId !== req.user.id && order.lenderId !== req.user.id) {
      return res.status(403).json({ message: '无权对该订单发起纠纷' });
    }

    const payload = validateDisputePayload(req.body?.statement, req.body?.images || []);

    const dispute = await createDispute({
      order,
      initiatorId: req.user.id,
      statement: payload.statement,
      images: payload.images
    });

    res.status(201).json({ message: '纠纷已发起', dispute });
  } catch (error) {
    if (isBadRequestError(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: '发起纠纷失败', error: error.message });
  }
};

const respondDispute = async (req, res) => {
  try {
    const dispute = await loadDisputeById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: '纠纷不存在' });
    }

    const payload = validateDisputePayload(req.body?.statement, req.body?.images || []);

    const updatedDispute = await respondToDispute({
      dispute,
      userId: req.user.id,
      statement: payload.statement,
      images: payload.images
    });

    res.json({ message: '纠纷回应已提交', dispute: updatedDispute });
  } catch (error) {
    if (isBadRequestError(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: '回应纠纷失败', error: error.message });
  }
};

const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.findAll({
      where: {
        [Op.or]: [
          { borrowerId: req.user.id },
          { lenderId: req.user.id }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    const fullDisputes = await Promise.all(disputes.map((dispute) => loadDisputeById(dispute.id)));

    res.json({ disputes: fullDisputes.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ message: '获取我的纠纷失败', error: error.message });
  }
};

module.exports = {
  getOrderDispute,
  createOrderDispute,
  respondDispute,
  getMyDisputes
};
