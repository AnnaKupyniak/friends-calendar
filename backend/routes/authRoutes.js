const express = require('express');
const { register, login,logout, deleteUser, getMe, updateDetails, updatePassword } = require('../controllers/authController');
const upload = require('../middleware/upload');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.delete('/delete', protect, deleteUser);

module.exports = router;