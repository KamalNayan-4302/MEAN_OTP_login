const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const jwt = require('jsonwebtoken');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Register new user
router.post('/register', upload.single('photo'), async (req, res) => {
    console.log('Register endpoint hit');
    try {
        let { name, email, mobile, password } = req.body;
        console.log('Received fields:', { name, email, mobile, password, file: req.file });
        // Fallback: If mobile/email/password are missing, try to parse JSON body (for non-multipart requests)
        if (!name || !email || !mobile || !password) {
            try {
                const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
                name = name || body.name;
                email = email || body.email;
                mobile = mobile || body.mobile;
                password = password || body.password;
            } catch (err) {}
        }
        // Validate inputs
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and mobile number are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
        console.log('Existing user lookup result:', existingUser);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or mobile number already exists'
            });
        }

        // Create new user
        let profilePhotoPath = req.file ? `/uploads/${req.file.filename}` : undefined;
        console.log('Profile photo path:', profilePhotoPath);
        // Support base64 photo from frontend
        if (!profilePhotoPath && req.body.profilePhoto && typeof req.body.profilePhoto === 'string' && req.body.profilePhoto.startsWith('data:')) {
            // Save base64 as file (optional: implement here if needed)
            // For now, ignore and do not set profilePhotoPath
        }
        const newUser = new User({
            // About to create new user
            name,
            email,
            mobile,
            password,
            profilePhoto: profilePhotoPath
        });

        await newUser.save();
        console.log('New user saved:', newUser._id);

        // Generate and send OTP
        console.log('Requesting OTP...');
        const otpResponse = await fetch('http://localhost:3000/api/auth/generate-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mobile })
        });

        const otpData = await otpResponse.json();
        console.log('OTP response:', otpData);

        if (!otpResponse.ok || !otpData.success) {
            console.error('OTP generation failed:', otpResponse.status, otpData);
            // Clean up the user since OTP generation failed
            await User.findByIdAndDelete(newUser._id);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate OTP. Please try again later.'
            });
        }

        console.log('Registration successful for user:', newUser._id);
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your mobile number using the OTP sent to your mobile.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
    }
});

// Update user profile
router.put('/profile', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            email: req.body.email
        };

        if (req.file) {
            updates.profilePhoto = `/uploads/${req.file.filename}`;
        }

        const user = await User.findOneAndUpdate(
            { mobile: req.user.mobile },
            updates,
            { new: true }
        );

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

module.exports = router;
