const { createHmac, randomBytes, createHash } = require("crypto");
const { Schema, model } = require('mongoose');
const crypto = require('crypto');
const { createTokenForUser } = require("../services/auth");

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    profileImageURL: {
        type: String,
        default: '/images/default.png',
    },
    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER",
    }
}, { timestamps: true });

userSchema.pre('save', function(next) {
    const user = this;
    if (!user.isModified("password")) return next();
    const salt = crypto.randomBytes(16).toString('hex'); // Generate a random salt
    const hashedPassword = crypto.createHmac('sha256', salt).update(user.password).digest('hex');
    user.salt = salt;
    user.password = hashedPassword;
    next();
});


userSchema.static('matchPasswordAndGenerateToken', async function(email, password) {
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error("User Not Found!!!");
    }
    const salt = user.salt;
    const hashedPassword = crypto.createHmac('sha256', salt).update(password).digest('hex');
    if (hashedPassword !== user.password) {
        throw new Error("Incorrect Password!!");
    }
    const token = createTokenForUser(user);
    return token;
});

const User = model('user', userSchema);

module.exports = User;