const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/violation', adminController.updateUserViolation);
router.put('/users/:id/password', adminController.updateUserPassword);
router.post('/users/:id/restrictions', adminController.createUserRestriction);
router.post('/users/:id/credit-adjustments', adminController.adjustCredit);

router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderDetail);

router.get('/disputes', adminController.getDisputes);
router.get('/disputes/:id', adminController.getDisputeDetail);
router.post('/disputes/:id/resolve', adminController.resolveDisputeAction);

router.get('/logs', adminController.getAdminActionLogs);

router.get('/admins', requireSuperAdmin, adminController.getAdmins);
router.post('/admins', requireSuperAdmin, adminController.createAdmin);
router.put('/admins/:id/deactivate', requireSuperAdmin, adminController.deactivateAdmin);
router.put('/admins/:id/reactivate', requireSuperAdmin, adminController.reactivateAdmin);
router.delete('/admins/:id', requireSuperAdmin, adminController.deleteAdmin);

module.exports = router;
