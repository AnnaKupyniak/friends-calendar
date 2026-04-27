const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getFriends,
  getFriendRequests,
  findFriend,
  addFriend,
  acceptFriendRequest,
  declineFriendRequest,
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
router.get('/friends/requests', getFriendRequests);
router.post('/friends', validateFriendshipInput, addFriend);      
router.post('/friends/accept', acceptFriendRequest);
router.post('/friends/decline', declineFriendRequest);
router.delete('/friends', validateFriendshipInput, removeFriend); 
router.post('/friends/:friendshipId/categories', validateFriendshipInput, addCategoryToFriendship);
router.put('/profile', updateUser);

module.exports = router;