const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireRole(['admin', 'root']));

router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

router.get('/items', adminController.getItems);
router.put('/items/:id/status', adminController.updateItemStatus);

router.get('/orders', adminController.getOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

router.get('/disputes', adminController.getDisputes);
router.put('/disputes/:id/resolve', adminController.resolveDispute);

router.post('/users', requireRole(['root']), adminController.createAdmin);
router.get('/admins', requireRole(['root']), adminController.getAdmins);

module.exports = router;
