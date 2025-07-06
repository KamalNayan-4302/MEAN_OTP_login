    require('dotenv').config();
    const express = require('express');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const path = require('path');

    const app = express();
    //const mongoose = require('mongoose');
    const authRoutes = require('./routes/auth');
    const userRoutes = require('./routes/user');
    const testRoutes = require('./routes/test');

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '5mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Serve uploaded profile photos
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Serve static files for production
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../dist')));
    }

    // Connect to MongoDB
    const mongoOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority'
    };

    mongoose.connect(process.env.MONGODB_URI, mongoOptions)
        .then(() => {
            console.log('Connected to MongoDB');
            // Create indexes for OTP collection
            const OTP = require('./models/OTP');
            OTP.createIndexes()
                .then(() => console.log('Created indexes for OTP collection'))
                .catch(err => console.error('Error creating indexes:', err));
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
            console.error('Connection String:', process.env.MONGODB_URI);
            process.exit(1); // Exit process if MongoDB connection fails
        });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/test', testRoutes);

    // Proxy /auth/login to /api/auth/login for frontend compatibility
    app.post('/auth/login', (req, res, next) => {
        req.url = '/login'; // adjust the URL so it matches the route in authRoutes
        authRoutes.handle(req, res, next);
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
