var express = require('express');
var router = express.Router();
var CategoryModel = require('../models/CategoryModel');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Xem danh sách category (cần đăng nhập)
router.get('/', requireAuth, async (req, res) => {
    var categoryList = await CategoryModel.find({});
    res.render('category/index', { 
        categoryList,
        isAdmin: req.session.user.role === 'admin'
    });
});

// Xóa category (chỉ admin)
router.get('/delete/:id', requireAdmin, async (req, res) => {
    var id = req.params.id;
    await CategoryModel.findByIdAndDelete(id);
    res.redirect('/category');
});

// Thêm category (chỉ admin)
router.get('/add', requireAdmin, (req, res) => {
    res.render('category/add');
});

router.post('/add', requireAdmin, async (req, res) => {
    var category = req.body;
    await CategoryModel.create(category);
    res.redirect('/category');
});

// Sửa category (chỉ admin)
router.get('/edit/:id', requireAdmin, async (req, res) => {
    var id = req.params.id;
    var category = await CategoryModel.findById(id);
    res.render('category/edit', { category });
});

router.post('/edit/:id', requireAdmin, async (req, res) => {
    var id = req.params.id;
    var data = req.body;
    await CategoryModel.findByIdAndUpdate(id, data);
    res.redirect('/category');
});

// ==================== RESTful API ====================

// API: Get all categories
router.get('/api/categories', async (req, res) => {
    try {
        const categories = await CategoryModel.find({});
        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// API: Get single category by ID
router.get('/api/categories/:id', async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// API: Create new category
router.post('/api/categories', async (req, res) => {
    try {
        const newCategory = await CategoryModel.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: newCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        });
    }
});

// API: Update category
router.put('/api/categories/:id', async (req, res) => {
    try {
        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        });
    }
});

// API: Delete category
router.delete('/api/categories/:id', async (req, res) => {
    try {
        const deletedCategory = await CategoryModel.findByIdAndDelete(req.params.id);
        
        if (!deletedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Category deleted successfully',
            data: deletedCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
            error: error.message
        });
    }
});

module.exports = router;