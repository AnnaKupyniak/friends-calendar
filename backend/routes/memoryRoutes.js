const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');

const { createMemory, createComment, getComments, getAllUserMemories, getMemoriesForEntity, updateMemory, deleteMemory } = require('../controllers/memoryController');
const { protect } = require('../middleware/auth');

router.post('/', protect, upload.array('photos', 10) , createMemory);
router.get('/', protect, getAllUserMemories);
router.get('/entity/:entityId', protect, getMemoriesForEntity);

router.route('/:id')
    .put(protect, upload.array('photos',10), updateMemory)
    .delete(protect, deleteMemory);
router.post('/:id/comments', protect, createComment)
router.get('/:id/comments', protect, getComments)

module.exports = router;