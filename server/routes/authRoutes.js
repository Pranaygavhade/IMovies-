const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar,
  removeAvatar,
} = require('../controllers/authController');
const { protectRoute } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, registerValidation, loginValidation } = require('../middleware/validator');

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.get('/me', protectRoute, getMe);
router.put('/profile', protectRoute, updateProfile);
router.post('/avatar', protectRoute, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', protectRoute, removeAvatar);
router.put('/change-password', protectRoute, changePassword);

module.exports = router;
