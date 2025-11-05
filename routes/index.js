var express = require('express');
var router = express.Router();
var CategoryModel = require('../models/CategoryModel');

router.get('/', async (req, res, next) => {
  try {
    // fetch all categories
    const categoryList = await CategoryModel.find().lean();
    res.render('category/index', { title: 'Categories', categoryList });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
