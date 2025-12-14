const express = require('express');
const router = express.Router();
const { registerOptions, registerVerify, loginOptions, loginVerify, getMe } = require('../controllers/authController');
const authenticate = require('../middleware/auth');

router.post('/register/options', registerOptions);
router.post('/register/verify', registerVerify);
router.post('/login/options', loginOptions);
router.post('/login/verify', loginVerify);
router.get('/me', authenticate, getMe);

module.exports = router;
