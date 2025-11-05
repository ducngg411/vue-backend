"use strict";

var express = require('express');

var app = express();

var mongoose = require('mongoose');

var datababse = "mongodb://localhost:27017/Web";

var bodyParser = require('body-parser');

var categoryRouter = require('./routers/category');

var productRouter = require('./routers/product');

app.use(bodyParser.urlencoded({
  extended: false
}));
app.listen(3000);
app.use(express["static"]('public'));