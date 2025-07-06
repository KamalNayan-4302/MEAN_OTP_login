const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false
    },
    mobile: {
        type: String,
        required: false
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Custom validation: at least one of email or mobile must be present
otpSchema.pre('validate', function(next) {
    if (!this.email && !this.mobile) {
        this.invalidate('email', 'At least email or mobile must be provided.');
    }
    next();
});

// Index for email
otpSchema.index({ email: 1 });

module.exports = mongoose.model('OTP', otpSchema);
