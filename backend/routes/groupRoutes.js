const express = require('express');
const router = express.Router();

const { 
  createGroup, 
  getGroupById, 
  getAllGroups, 
  updateGroup, 
  deleteGroup,
  addMembers,        // Зверніть увагу: в контролері може бути addMembers, а не addMember
  removeMember,
  addCategoryToGroup 
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

console.log('Imported functions:', { 
  createGroup, 
  getGroupById, 
  getAllGroups, 
  updateGroup, 
  deleteGroup,
  addMembers,
  removeMember,
  addCategoryToGroup 
});

router.use(protect); 

router.route('/')
    .post(createGroup)
    .get(getAllGroups);

router.route('/:id')
    .get(getGroupById)
    .put(updateGroup)
    .delete(deleteGroup);

router.post('/:id/categories', addCategoryToGroup);
router.post('/:id/members', addMembers); 
router.delete('/:id/members/:memberId', removeMember);

module.exports = router;