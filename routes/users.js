var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const UserModel = require('../models/UserModel');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Route for login
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await UserModel.findOne({ username });
        if (user && bcrypt.compareSync(password, user.password)) {
            // Lưu thông tin user vào session
            req.session.user = {
                id: user._id,
                username: user.username,
                role: user.role
            };
            
            // Kiểm tra xem request từ API hay form
            if (req.headers['content-type'] === 'application/json') {
                // Response cho API call (từ Vue)
                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: user._id,
                        username: user.username,
                        role: user.role
                    }
                });
            } else {
                // Response cho form submission (traditional)
                res.redirect('/users/dashboard');
            }
        } else {
            if (req.headers['content-type'] === 'application/json') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid username or password'
                });
            } else {
                res.send('Invalid username or password');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (req.headers['content-type'] === 'application/json') {
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        } else {
            res.status(500).send('Server error');
        }
    }
});

// Route for register
router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', async (req, res) => {
    const { username, password, repeatPassword } = req.body;
    
    // Kiểm tra password và repeat password có khớp nhau không
    if (password !== repeatPassword) {
        if (req.headers['content-type'] === 'application/json') {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        } else {
            return res.send('Passwords do not match');
        }
    }
    
    try {
        // Kiểm tra username đã tồn tại chưa
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            if (req.headers['content-type'] === 'application/json') {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            } else {
                return res.send('Username already exists');
            }
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new UserModel({ 
            username, 
            password: hashedPassword, 
            role: 'customer' // Mặc định role là customer
        });
        await newUser.save();
        
        if (req.headers['content-type'] === 'application/json') {
            res.status(201).json({
                success: true,
                message: 'Registration successful'
            });
        } else {
            res.send('Registration successful');
        }
    } catch (error) {
        console.error('Register error:', error);
        if (req.headers['content-type'] === 'application/json') {
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        } else {
            res.status(500).send('Server error');
        }
    }
});

// Route for dashboard (cần đăng nhập)
router.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', {
        username: req.session.user.username,
        role: req.session.user.role,
        isAdmin: req.session.user.role === 'admin'
    });
});

// Route for logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
                return res.status(500).json({
                    success: false,
                    message: 'Could not log out'
                });
            }
            return res.status(500).send('Could not log out');
        }
        
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } else {
            res.redirect('/users/login');
        }
    });
});

// API: Check authentication status
router.get('/check-auth', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            success: true,
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            success: true,
            authenticated: false
        });
    }
});

module.exports = router;
