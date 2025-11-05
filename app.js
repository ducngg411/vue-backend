require('dotenv').config();
var express = require('express');
var app = express();
var session = require('express-session');
var MongoStore = require('connect-mongo');
var cors = require('cors');

var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var categoryRouter = require('./routes/category');
var productRouter = require('./routes/product');
var usersRouter = require('./routes/users');

// Cấu hình CORS - Phải đặt TRƯỚC session
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ['http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cấu hình session với MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update (24 hours)
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true in production (HTTPS only)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Cấu hình view engine hbs
var hbs = require('hbs');
app.set('view engine', 'hbs');
app.set('views', './views');

// Đăng ký helper cho Handlebars
hbs.registerHelper('eq', function(a, b) {
    return a == b;
});

hbs.registerHelper('unless', function(conditional, options) {
    if (!conditional) {
        return options.fn(this);
    }
    return options.inverse(this);
});

// Body parser cho URL-encoded data (từ forms)
app.use(bodyParser.urlencoded({ extended: false}));
// Body parser cho JSON data (từ API calls)
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/users/dashboard');
  } else {
    res.redirect('/users/login');
  }
});

app.use('/category', categoryRouter);
app.use('/product', productRouter);
app.use('/users', usersRouter);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

module.exports = app;