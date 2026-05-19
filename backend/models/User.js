const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullName:{
        type: String
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Будь ласка, введіть коректну електронну пошту']
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    avatar:{
        type: String,
        default: "default-avatar.png"
    },
    groups:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        }
    ]
},
{ timestamps: true }
);

UserSchema.pre('save', async function(){
    if(!this.isModified('password')) return;
    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }catch(err){
        throw new Error('Error hashing password');
    }
})

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

UserSchema.methods.getSignedJwtToken = function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    })
}

UserSchema.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
}

UserSchema.index({ username: "text", fullName: "text" });

module.exports = mongoose.model('User', UserSchema);
