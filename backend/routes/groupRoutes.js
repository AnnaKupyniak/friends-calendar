const express = require('express');
const router = express.Router();

const { 
  createGroup, 
  getGroupById, 
  getAllGroups, 
  updateGroup, 
  deleteGroup,
  addMembers,
  removeMember,
  addCategoryToGroup 
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const { validateGroupInput } = require('../middleware/validation');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
    .post(upload.single('avatar'), validateGroupInput, createGroup)
    .get(getAllGroups);

router.route('/:id')
    .get(getGroupById)
    .put(upload.single('avatar'), validateGroupInput, updateGroup)
    .delete(deleteGroup);

router.post('/:id/categories', validateGroupInput, addCategoryToGroup);
router.post('/:id/members', validateGroupInput, addMembers); 
router.delete('/:id/members/:memberId', validateGroupInput, removeMember);

module.exports = router;

