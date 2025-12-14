const express = require('express');
const multer = require('multer');
const { updateName, updatePhoto, deletePhoto } = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.put('/name', authenticate, updateName);
router.put('/photo', authenticate, upload.single('photo'), updatePhoto);
router.delete('/photo', authenticate, deletePhoto);

module.exports = router;
