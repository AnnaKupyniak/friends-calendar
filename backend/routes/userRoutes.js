const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getFriends,
  findFriend,
  addFriend,
  removeFriend,
  addCategoryToFriendship,
  updateUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validateFriendshipInput } = require('../middleware/validation');

router.use(protect);

router.get('/', getAllUsers);

router.get('/friends/find', findFriend); 
router.get('/friends', getFriends);    
router.post('/friends', validateFriendshipInput, addFriend);      
router.delete('/friends', validateFriendshipInput, removeFriend); 
router.post('/friends/:friendshipId/categories', validateFriendshipInput, addCategoryToFriendship);
router.put('/profile', updateUser);

module.exports = router;