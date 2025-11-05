const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Kiểm tra xem Cloudinary đã được cấu hình chưa
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                process.env.CLOUDINARY_API_KEY && 
                                process.env.CLOUDINARY_API_SECRET;

// Storage configuration
let storage;

if (isCloudinaryConfigured) {
    // Sử dụng Cloudinary storage nếu đã cấu hình
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'products', // Thư mục trong Cloudinary
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [{ width: 800, height: 800, crop: 'limit' }] // Tự động resize
        }
    });
    console.log('Using Cloudinary storage for uploads');
} else {
    // Fallback về local storage nếu chưa cấu hình Cloudinary
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
    console.log('Warning: Using local storage. Configure Cloudinary for production.');
}

// Kiểm tra file type
const fileFilter = (req, file, cb) => {
    console.log('File filter checking:', file.originalname, file.mimetype);
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        console.log('File accepted');
        return cb(null, true);
    } else {
        console.log('File rejected - not an image');
        cb(new Error('Only image files are allowed!'));
    }
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    },
    fileFilter: fileFilter
});

// Error handler cho multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.log('Multer error:', err);
        return res.status(400).send('File upload error: ' + err.message);
    } else if (err) {
        console.log('Upload error:', err);
        return res.status(400).send('Upload error: ' + err.message);
    }
    next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;
