var express = require('express');
var app = express();
var session = require('express-session');
var cors = require('cors');

var mongoose = require('mongoose');
var datababse = "mongodb+srv://ducntgch221177:Ducham2004@cluster0.zob9b.mongodb.net/Web?retryWrites=true&w=majority";
var bodyParser = require('body-parser');
var categoryRouter = require('./routes/category');
var productRouter = require('./routes/product');
var usersRouter = require('./routes/users');

// Cấu hình CORS - Phải đặt TRƯỚC session
app.use(cors({
  origin: 'http://localhost:5173', // URL của frontend Vue
  credentials: true, // Cho phép gửi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cấu hình session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
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

mongoose.connect(datababse)
  .then(() => {
    console.log("Connected to database " + datababse);
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

module.exports = app;