const crypto = require('crypto');
const User = require('../models/User');

exports.register = async (req, res) => {
    const { username, fullName, email, password } = req.body;

    const avatar = req.file
        ? req.file.filename
        : "default-avatar.png";

    const user = await User.create({
        username,
        fullName,
        email,
        password,
        avatar
    });

    sendTokenResponse(user, 200, res);
};
exports.login = async(req,res) =>{
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(401).json({ message: 'Будь ласка, вкажіть електронну пошту та пароль' });
    }

    const user = await User.findOne({email}).select('+password');
    if(!user){
         return res.status(401).json({ message: 'Користувача не знайдено' });
    }
    const isMatch = await user.matchPassword(password);
    if(!isMatch){
        return res.status(401).json({ message: 'Невірний пароль' });
    }
    sendTokenResponse(user, 200, res);
}

exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000), 
    httpOnly: true,
  });
    res.status(200).json({ success: true, message: 'Вихід виконано успішно' });
};

exports.deleteUser = async(req,res) => {
    const user = await User.findByIdAndDelete(req.user.id);
    if(!user){
        return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    res.status(200).json({ message: 'Користувача успішно видалено' });
}

exports.getMe = async(req,res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
}


exports.updateDetails = async(req,res) => {
    const fieldsToUpdate = {
        username: req.body.username,
        fullName: req.body.fullName,
        email: req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    })
    res.status(200).json({ success: true, data: user });
}

exports.updatePassword = async (req, res) => {
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
        return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    if (!req.body.currentPassword || !req.body.newPassword) {
        return res.status(400).json({ message: 'Будь ласка, вкажіть поточний і новий пароль' });
    }

    const isMatch = await user.matchPassword(req.body.currentPassword);

    if (!isMatch) {
        return res.status(401).json({ message: 'Невірний пароль' });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
};


const sendTokenResponse = async(user,statusCode, res) =>{
    const token = user.getSignedJwtToken()
    const options = {
        expires : new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    // if(process.env.NODE_ENV == "production"){
    //     options.secure = true;
    // }
    res.status(statusCode).cookie('token',token,options).json({success: true, token})
}

// Forgot Password
// exports.forgotPassword = async(req,res) => {
//     const user = await User.findOne({email: req.body.email});
//     if(!user){
//         return res.status(404).json({ message: 'There is no user with that email' });
//     }
//     const resetToken = user.getResetPasswordToken();
// }

// Reset Password 