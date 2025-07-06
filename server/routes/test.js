const express = require('express');
const router = express.Router();
const OTP = require('../models/OTP');

router.get('/test-mongodb', async (req, res) => {
    try {
        // Test by creating a sample OTP
        const testOtp = new OTP({
            mobile: '9999999999',
            otp: '123456',
            expiresAt: new Date(Date.now() + 1000 * 60 * 15) // 15 minutes from now
        });

        await testOtp.save();
        
        // Fetch and return the created OTP
        const savedOtp = await OTP.findOne({ mobile: '9999999999' });
        res.json({ 
            success: true, 
            message: 'MongoDB is working!', 
            data: savedOtp 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error testing MongoDB connection', 
            error: error.message 
        });
    }
});

module.exports = router;
