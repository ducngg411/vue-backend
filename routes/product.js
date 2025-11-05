var express = require('express');
var router = express.Router();
var ProductModel = require('../models/ProductModel');
var CategoryModel = require('../models/CategoryModel');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// TEST ROUTE - Check multer
router.post('/test-upload', upload.single('image'), (req, res) => {
    console.log('=== MULTER TEST ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    res.json({
        body: req.body,
        file: req.file
    });
});

// Xem danh sách product (cần đăng nhập)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { search, sortBy, sortOrder, category } = req.query;
        
        // Tạo query object
        let query = {};
        
        // Thêm search nếu có
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        // Thêm filter theo category nếu có
        if (category && category !== '') {
            query.category = category;
        }
        
        // Tạo sort object
        let sortObj = {};
        if (sortBy) {
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortObj.name = 1; // Mặc định sort theo tên
        }
        
        var productList = await ProductModel.find(query).populate('category').sort(sortObj);
        var categoryList = await CategoryModel.find({});
        
        res.render('product/index', { 
            productList,
            categoryList,
            isAdmin: req.session.user.role === 'admin',
            search: search || '',
            sortBy: sortBy || 'name',
            sortOrder: sortOrder || 'asc',
            selectedCategory: category || ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Xóa product (chỉ admin)
router.get('/delete/:id', requireAdmin, async (req, res) => {
    try {
        var id = req.params.id;
        await ProductModel.findByIdAndDelete(id);
        console.log('Product deleted:', id);
        res.redirect('/product?success=deleted');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Error deleting product: ' + error.message);
    }
});

// Thêm product (chỉ admin)
router.get('/add', requireAdmin, async (req, res) => {
    try {
        var categoryList = await CategoryModel.find({});
        console.log('Categories loaded:', categoryList.length);
        res.render('product/add', { categoryList });
    } catch (error) {
        console.error('Error loading add page:', error);
        res.status(500).send('Error loading form');
    }
});

// Thêm product (chỉ admin) - WITH MULTER FIXED
router.post('/add', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        console.log('=== ADD PRODUCT DEBUG ===');
        console.log('req.body:', req.body);
        console.log('req.file:', req.file);
        
        // Validate required fields
        if (!req.body.name || !req.body.price || !req.body.category) {
            console.log('ERROR: Missing required fields');
            return res.status(400).send('Missing required fields: name, price, and category are required');
        }
        
        var productData = {
            name: req.body.name,
            price: parseFloat(req.body.price),
            category: req.body.category,
            description: req.body.description || ''
        };
        
        // Ưu tiên file upload, nếu không có thì dùng imageUrl
        if (req.file) {
            // Nếu dùng Cloudinary, path sẽ là URL đầy đủ
            productData.image = req.file.path || ('/images/' + req.file.filename);
            console.log('Using uploaded file:', productData.image);
        } else if (req.body.imageUrl && req.body.imageUrl.trim() !== '') {
            productData.image = req.body.imageUrl;
            console.log('Using image URL:', productData.image);
        }
        
        console.log('Product data to save:', JSON.stringify(productData, null, 2));
        
        const newProduct = await ProductModel.create(productData);
        console.log('Product saved to DB:', JSON.stringify(newProduct.toObject(), null, 2));
        
        res.redirect('/product?success=added');
    } catch (error) {
        console.error('Error adding product:', error);
        console.error('Error stack:', error.stack);
        res.status(500).send('Error adding product: ' + error.message);
    }
});

// Sửa product (chỉ admin)
router.get('/edit/:id', requireAdmin, async (req, res) => {
    var id = req.params.id;
    var product = await ProductModel.findById(id);
    var categoryList = await CategoryModel.find({});
    res.render('product/edit', { product, categoryList });
});

router.post('/edit/:id', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        var id = req.params.id;
        console.log('=== EDIT PRODUCT DEBUG ===');
        console.log('Product ID:', id);
        console.log('req.body:', req.body);
        console.log('req.file:', req.file);
        
        var updateData = {
            name: req.body.name,
            price: parseFloat(req.body.price),
            category: req.body.category,
            description: req.body.description || ''
        };
        
        // Ưu tiên file upload, nếu không có thì dùng imageUrl
        if (req.file) {
            updateData.image = req.file.path || ('/images/' + req.file.filename);
            console.log('Using uploaded file:', updateData.image);
        } else if (req.body.imageUrl && req.body.imageUrl.trim() !== '') {
            updateData.image = req.body.imageUrl;
            console.log('Using image URL:', updateData.image);
        }
        // Nếu không có cả file và URL, giữ nguyên image cũ (không update)
        
        console.log('Update data:', JSON.stringify(updateData, null, 2));
        
        const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateData, { new: true });
        console.log('Product updated:', JSON.stringify(updatedProduct.toObject(), null, 2));
        res.redirect('/product?success=updated');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Error updating product: ' + error.message);
    }
});

// ==================== RESTful API ====================

// API: Get all products
router.get('/api/products', async (req, res) => {
    try {
        const { search, sortBy, sortOrder, category } = req.query;
        
        let query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category && category !== '') {
            query.category = category;
        }
        
        let sortObj = {};
        if (sortBy) {
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortObj.name = 1;
        }
        
        const products = await ProductModel.find(query).populate('category').sort(sortObj);
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// API: Get single product by ID
router.get('/api/products/:id', async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// API: Create new product with image upload
router.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        
        // Tạo product data
        const productData = {
            name,
            price,
            category,
            description
        };
        
        // Nếu có upload file, thêm đường dẫn vào data
        if (req.file) {
            productData.image = req.file.path || ('/images/' + req.file.filename);
        }
        
        const newProduct = await ProductModel.create(productData);
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message
        });
    }
});

// API: Update product with optional image upload
router.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        
        const updateData = {
            name,
            price,
            category,
            description
        };
        
        // Nếu có upload file mới, cập nhật đường dẫn
        if (req.file) {
            updateData.image = req.file.path || ('/images/' + req.file.filename);
        }
        
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message
        });
    }
});

// API: Delete product
router.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await ProductModel.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: deletedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message
        });
    }
});

module.exports = router;
