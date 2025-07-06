const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Nodemailer transporter setup (configure your SMTP in .env)
// Gmail integration for OTP emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function sendOtpEmail(email, otp) {
    const html = `<div style="font-family:sans-serif;padding:20px;">
        <h2>Email Verification - OTP</h2>
        <p>Your OTP code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#007bff;">${otp}</div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr>
        <small>OTP Auth App</small>
    </div>`;
    return transporter.sendMail({
        from: process.env.EMAIL_USER, // Use Gmail address as sender
        to: email,
        subject: 'Your OTP Code',
        html
    });
}


// Generate OTP (for registration or verification)
router.post('/generate-otp', async (req, res) => {
    try {
        const { mobile, email } = req.body;
        if (!mobile && !email) {
            return res.status(400).json({ success: false, message: 'Mobile or email is required.' });
        }
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        // Save OTP in DB
        await OTP.create({ email: email || '', mobile: mobile || '', otp, expiresAt });
        // Send OTP via email if email is present
        if (email) {
            try {
                await sendOtpEmail(email, otp);
                console.log('OTP email sent to', email);
            } catch (err) {
                console.error('Failed to send OTP email:', err);
                return res.status(500).json({ success: false, message: 'Failed to send OTP email.', error: err.message });
            }
        }
        // (You can add SMS sending logic if needed)
        return res.json({ success: true, message: 'OTP generated and sent.', otp });
    } catch (err) {
        console.error('Generate OTP error:', err);
        return res.status(500).json({ success: false, message: 'Failed to generate OTP.', error: err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, mobile, otp } = req.body;
        console.log('Verifying OTP:', { email, mobile, otp });
        if ((!email && !mobile) || !otp) {
            return res.status(400).json({ success: false, message: 'Email or mobile and OTP are required.' });
        }
        // Find OTP
        const otpDoc = await OTP.findOne({
            $or: [
                email ? { email } : {},
                mobile ? { mobile } : {}
            ],
            otp
        });
        if (!otpDoc) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        }
        if (otpDoc.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired.' });
        }
        // Mark user as verified
        const user = await User.findOneAndUpdate(
            email ? { email } : { mobile },
            { isVerified: true },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        // Optionally, delete OTP after successful verification
        await OTP.deleteOne({ _id: otpDoc._id });
        // Generate JWT token
        const token = jwt.sign({ id: user._id, email: user.email, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        return res.json({ success: true, message: 'OTP verified. User is now verified.', token, user });
    } catch (err) {
        console.error('Verify OTP error:', err);
        return res.status(500).json({ success: false, message: 'Failed to verify OTP.', error: err.message });
    }
});

// Register new user (email, password, optional name/profilePhoto)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, profilePhoto } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        const hash = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hash, profilePhoto, isVerified: false });
        await user.save();
        // Generate OTP for email verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OTP.create({ email, otp, expiresAt });
        await sendOtpEmail(email, otp);
        return res.status(200).json({ success: true, message: 'Registered! Please verify your email with the OTP sent.' });
    } catch (err) {
        console.error('Register error:', err);
        if (err.response) {
            // Nodemailer sendMail error details
            console.error('Nodemailer error response:', err.response);
        }
        return res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
    }
});

// Verify email OTP
router.post('/verify-email-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord || new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }
        const user = await User.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );
        await OTP.deleteMany({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        // Generate JWT token
        const token = jwt.sign({ id: user._id, email: user.email, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        return res.status(200).json({ success: true, message: 'Email verified. You can now log in.', token, user });
    } catch (err) {
        console.error('OTP verify error:', err);
        return res.status(500).json({ success: false, message: 'OTP verification failed.', error: err.message });
    }
});

// Login with password
router.post('/login', async (req, res) => {
    try {
        const { email, mobile, password } = req.body;
        if ((!email && !mobile) || !password) {
            return res.status(400).json({ success: false, message: 'Email or mobile and password are required.' });
        }
        // Find user by email or mobile
        const user = await User.findOne(email ? { email } : { mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User with provided email or mobile not registered.' });
        }
        if (!user.isVerified) {
            return res.status(400).json({ success: false, message: 'User not verified. Please verify OTP.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Incorrect password.' });
        }
        const token = jwt.sign({ id: user._id, email: user.email, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        return res.status(200).json({ success: true, token, user });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Login failed.', error: err.message });
    }
});


router.post('/login-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email not registered.' });
        }
        if (!user.isVerified) {
            return res.status(400).json({ success: false, message: 'Email not verified. Please verify OTP.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OTP.create({ email, otp, expiresAt });
        await sendOtpEmail(email, otp);
        return res.status(200).json({ success: true, message: 'OTP sent to email.' });
    } catch (err) {
        console.error('Login OTP error:', err);
        return res.status(500).json({ success: false, message: 'Failed to send OTP.', error: err.message });
    }
});

// Login with OTP
router.post('/verify-login-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord || new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email not registered.' });
        }
        await OTP.deleteMany({ email });
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        return res.status(200).json({ success: true, token, user });
    } catch (err) {
        console.error('Verify login OTP error:', err);
        return res.status(500).json({ success: false, message: 'Login by OTP failed.', error: err.message });
    }
});

// All legacy mobile-based code removed below this point. Only email/password/OTP endpoints remain.

module.exports = router;
