const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); 

const { createMemory, getAllUserMemories, getMemoriesForEntity, updateMemory, deleteMemory } = require('../controllers/memoryController');
const { protect } = require('../middleware/auth');

router.post('/', protect, upload.single('photo'), createMemory);
router.get('/', protect, getAllUserMemories);
router.get('/entity/:entityId', protect, getMemoriesForEntity);

router.route('/:id')
    .put(protect, updateMemory)
    .delete(protect, deleteMemory);

module.exports = router;