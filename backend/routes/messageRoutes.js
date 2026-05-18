const express = require('express');
const router = express.Router();

const { getMessages, uploadImage, deleteMessage, editMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getMessages);
router.post('/upload', protect, upload.single('image'), uploadImage);
router.put('/:id', protect, editMessage);
router.delete('/:id', protect, deleteMessage);

module.exports = router;