const express = require('express');
const router = express.Router();
const {
  getUsers,
  inviteUser,
  updateUser
} = require('../controllers/userController');
const { authenticate, tenantIsolation } = require('../middleware/auth');

router.use(authenticate);
router.use(tenantIsolation);

router.get('/', getUsers);
router.post('/invite', inviteUser);
router.put('/:id', updateUser);

module.exports = router;
