const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protectRoute } = require('../middleware/auth');
const { validate, registerValidation, loginValidation } = require('../middleware/validator');

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.get('/me', protectRoute, getMe);
router.put('/profile', protectRoute, updateProfile);
router.put('/change-password', protectRoute, changePassword);

module.exports = router;
