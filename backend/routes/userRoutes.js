const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getFriends,
  findFriend,
  addFriend,
  removeFriend,
  addCategoryToFriendship
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', getAllUsers);

router.use(protect);

router.get('/friends/find', findFriend); 
router.get('/friends', getFriends);    
router.post('/friends', addFriend);      
router.delete('/friends', removeFriend); 
router.post('/friends/:friendshipId/categories', protect, addCategoryToFriendship);

module.exports = router;