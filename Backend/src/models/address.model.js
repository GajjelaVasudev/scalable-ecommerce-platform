const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        addressLine: {
            type: String,
            required: [true, 'Address line is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        postalCode: {
            type: String,
            required: [true, 'Postal code is required'],
            trim: true
        },
        country: {
            type: String,
            default: 'India',
            trim: true
        },
        tag: {
            type: String,
            enum: ['HOME', 'WORK', 'OTHER'],
            default: 'HOME'
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id.toString();
                return ret;
            }
        },
        toObject: {
            transform(doc, ret) {
                ret.id = ret._id.toString();
                return ret;
            }
        }
    }
);

// MongoDB partial unique index: guarantees at the database engine level
// that a user can never have more than one address where isDefault: true.
addressSchema.index(
    { user: 1 },
    {
        unique: true,
        partialFilterExpression: { isDefault: true }
    }
);
addressSchema.index({ user: 1, createdAt: -1 });

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
