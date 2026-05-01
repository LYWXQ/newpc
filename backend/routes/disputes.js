const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.put('/:id/respond', disputeController.respondDispute);
router.get('/mine', disputeController.getMyDisputes);

module.exports = router;
