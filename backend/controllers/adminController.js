const bcrypt = require('bcryptjs');
const { User, Item, Order, Review } = require('../models');

const getDashboard = async (req, res) => {
  try {
    const userCount = await User.count();
    const itemCount = await Item.count();
    const orderCount = await Order.count();
    const reviewCount = await Review.count();

    const recentOrders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'lender' },
        { model: User, as: 'borrower' }
      ]
    });

    res.json({
      stats: {
        userCount,
        itemCount,
        orderCount,
        reviewCount
      },
      recentOrders
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: '获取仪表板失败', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (keyword) {
      where[require('sequelize').Op.or] = [
        { username: { [require('sequelize').Op.like]: `%${keyword}%` } },
        { studentId: { [require('sequelize').Op.like]: `%${keyword}%` } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.role === 'root') {
      return res.status(403).json({ message: '不能修改超级用户状态' });
    }

    await user.update({ status });

    res.json({ message: '用户状态更新成功', user });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: '更新用户状态失败', error: error.message });
  }
};

const getItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (keyword) {
      where.title = { [require('sequelize').Op.like]: `%${keyword}%` };
    }
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Item.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [{ model: User, as: 'user' }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      items: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: '获取物品列表失败', error: error.message });
  }
};

const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    await item.update({ status });

    res.json({ message: '物品状态更新成功', item });
  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({ message: '更新物品状态失败', error: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'lender' },
        { model: User, as: 'borrower' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: '获取订单列表失败', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    await order.update({ status });

    res.json({ message: '订单状态更新成功', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: '更新订单状态失败', error: error.message });
  }
};

const getDisputes = async (req, res) => {
  try {
    res.json({ disputes: [] });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ message: '获取纠纷列表失败', error: error.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    res.json({ message: '纠纷处理成功' });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ message: '处理纠纷失败', error: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '该用户名已被使用' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: 'admin',
      creditScore: 100,
      isVerified: true
    });

    res.status(201).json({
      message: '管理员创建成功',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: '创建管理员失败', error: error.message });
  }
};

const getAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: {
        role: ['admin', 'root']
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'username', 'role', 'status', 'createdAt']
    });

    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: '获取管理员列表失败', error: error.message });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  updateUserStatus,
  getItems,
  updateItemStatus,
  getOrders,
  updateOrderStatus,
  getDisputes,
  resolveDispute,
  createAdmin,
  getAdmins
};
