const multer = require('multer');
const path = require('path');

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/'); // Lưu vào thư mục public/images
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique: timestamp + tên gốc
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Kiểm tra file type
const fileFilter = (req, file, cb) => {
    console.log('File filter checking:', file.originalname, file.mimetype);
    // Chỉ chấp nhận file ảnh
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
