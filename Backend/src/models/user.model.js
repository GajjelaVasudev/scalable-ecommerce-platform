const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"]
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
    },
    firstName: {
        type: String,
        trim: true,
        maxlength: [100, 'First name cannot exceed 100 characters'],
        default: ''
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: [100, 'Last name cannot exceed 100 characters'],
        default: ''
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: [100, 'Display name cannot exceed 100 characters'],
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    altPhone: {
        type: String,
        trim: true,
        default: null
    },
    avatarUrl: {
        type: String,
        trim: true,
        maxlength: [500, 'Avatar URL cannot exceed 500 characters'],
        default: null
    },
    gender: {
        type: String,
        enum: {
            values: ['female', 'male', 'non-binary', 'prefer-not-to-say'],
            message: 'Gender must be female, male, non-binary, or prefer-not-to-say'
        },
        default: 'prefer-not-to-say'
    },
    dateOfBirth: {
        type: Date,
        default: null,
        validate: {
            validator: function (val) {
                if (!val) return true;
                const d = new Date(val);
                if (isNaN(d.getTime())) return false;
                const now = new Date();
                const min = new Date('1900-01-01');
                return d <= now && d >= min;
            },
            message: 'Date of birth must be a valid past date between 1900 and today'
        }
    },
    commLang: {
        type: String,
        enum: {
            values: ['en', 'hi', 'kn', 'ta', 'mr'],
            message: 'Communication language must be en, hi, kn, ta, or mr'
        },
        default: 'en'
    },
    resetPasswordToken: {
        type: String,
        default: null,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
        select: false
    }
}, {
    timestamps: true,
    toJSON: {
        transform(doc, ret) {
            delete ret.password;
            delete ret.resetPasswordToken;
            delete ret.resetPasswordExpires;
            return ret;
        }
    },
    toObject: {
        transform(doc, ret) {
            delete ret.password;
            delete ret.resetPasswordToken;
            delete ret.resetPasswordExpires;
            return ret;
        }
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;