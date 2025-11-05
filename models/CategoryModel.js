var mongoose = require('mongoose');
var CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },

        description: String,
    }
);

var CategoryModel = mongoose.model('Category', CategorySchema);
module.exports = CategoryModel;