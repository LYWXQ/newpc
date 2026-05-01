const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User, UserRestriction } = require('../models');
const {
  cancelUserDeletion,
  checkUserHasActiveBusiness,
  isValidQQ,
  scheduleUserDeletion,
  serializeUser
} = require('../accountLifecycle');

// 获取用户信息
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
});

// 更新用户信息 (支持POST和PUT)
const updateProfile = async (req, res) => {
  try {
    const { avatar, phone, qq, email, school, major } = req.body;
    const user = req.user;

    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: '请输入正确的手机号' });
    }

    if (qq !== undefined && qq !== null && qq !== '' && !isValidQQ(qq)) {
      return res.status(400).json({ message: '请输入正确的QQ号' });
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ message: '该手机号已被其他用户使用' });
      }
    }

    await user.update({
      avatar: avatar !== undefined ? avatar : user.avatar,
      phone: phone !== undefined ? phone : user.phone,
      qq: qq !== undefined ? qq : user.qq,
      email: email !== undefined ? email : user.email,
      school: school !== undefined ? school : user.school,
      major: major !== undefined ? major : user.major
    });

    res.json({
      message: 'Profile updated successfully',
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

router.put('/profile', authenticateToken, updateProfile);
router.post('/profile', authenticateToken, updateProfile);

router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    if (user.role !== 'user') {
      return res.status(403).json({ message: '仅普通用户可通过此入口修改密码' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '旧密码和新密码不能为空' });
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidOldPassword) {
      return res.status(400).json({ message: '旧密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    res.status(500).json({ message: '修改密码失败', error: error.message });
  }
});

// 上传头像
router.post('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    const user = req.user;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }

    await user.update({ avatar });

    res.json({
      message: 'Avatar updated successfully',
      url: avatar
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update avatar', error: error.message });
  }
});

router.post('/deletion-request', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.deletionStatus === 'pending' && user.deletionDeadlineAt) {
      return res.status(409).json({
        message: '您已提交注销申请',
        deletionStatus: user.deletionStatus,
        deletionRequestedAt: user.deletionRequestedAt,
        deletionDeadlineAt: user.deletionDeadlineAt
      });
    }

    if (user.deletionStatus === 'deleted' || user.status === 'deleted') {
      return res.status(403).json({ message: '账号已注销' });
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      return res.status(403).json({ message: '后台账号不支持通过普通用户流程注销' });
    }

    if (user.isViolationUser) {
      return res.status(400).json({
        message: '当前账号已被标记为违规，暂无法注销',
        code: 'DELETION_BLOCKED_BY_VIOLATION'
      });
    }

    const activeRestrictionCount = await UserRestriction.count({
      where: {
        userId: user.id,
        isActive: true
      }
    });

    if (activeRestrictionCount > 0) {
      return res.status(400).json({
        message: '当前账号存在生效中的限制记录，暂无法注销',
        code: 'DELETION_BLOCKED_BY_RESTRICTION'
      });
    }

    const activeBusiness = await checkUserHasActiveBusiness(user.id);
    if (activeBusiness.hasActiveBusiness) {
      return res.status(400).json({
        message: '当前存在未完成业务，暂无法注销',
        code: 'DELETION_BLOCKED_BY_ACTIVE_BUSINESS',
        detail: activeBusiness
      });
    }

    await scheduleUserDeletion(user);

    res.json({
      message: '注销申请已提交，可在7天内登录取消注销',
      deletionStatus: user.deletionStatus,
      deletionRequestedAt: user.deletionRequestedAt,
      deletionDeadlineAt: user.deletionDeadlineAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to schedule deletion request', error: error.message });
  }
});

router.post('/deletion-request/cancel', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.deletionStatus !== 'pending') {
      return res.status(400).json({ message: '当前没有可取消的注销申请' });
    }

    await cancelUserDeletion(user);

    res.json({
      message: '已取消注销申请',
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel deletion request', error: error.message });
  }
});

module.exports = router;