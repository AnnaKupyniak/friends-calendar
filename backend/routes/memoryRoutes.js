const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { validateMemoryInput, validateCommentInput } = require('../middleware/validation');

const { 
  createMemory, 
  createComment, 
  getComments, 
  getAllUserMemories, 
  getMemoriesForEntity, 
  updateMemory, 
  deleteMemory,
  searchAndFilterMemories,
  getAllTags
} = require('../controllers/memoryController');

const { protect } = require('../middleware/auth');

// Основні операції
router.post('/', protect, upload.array('photos', 10), validateMemoryInput, createMemory);
router.get('/', protect, getAllUserMemories);
router.get('/entity/:entityId', protect, getMemoriesForEntity);

// Пошук та фільтрація
router.get('/search', protect, searchAndFilterMemories);
router.get('/tags', protect, getAllTags);

// CRUD операції
router.route('/:id')
    .put(protect, upload.array('photos', 10), validateMemoryInput, updateMemory)
    .delete(protect, deleteMemory);

// Коментарі
router.post('/:id/comments', protect, validateCommentInput, createComment);
router.get('/:id/comments', protect, getComments);

module.exports = router;