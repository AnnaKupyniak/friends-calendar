const express = require('express');
const { register, login, logout, deleteUser, getMe, updateDetails, updatePassword } = require('../controllers/authController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { validateUserInput } = require('../middleware/validation');
const router = express.Router();

router.post('/register', validateUserInput, upload.single('avatar'), register);
router.post('/login', validateUserInput, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, validateUserInput, updateDetails);
router.put('/updatepassword', protect, validateUserInput, updatePassword);
router.delete('/delete', protect, deleteUser);

module.exports = router;