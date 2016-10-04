var express = require("express");
var app = express();
var bodyParser = require('body-parser')

console.log("--- startup ---")

var shopController = require('./shop/shop-controller');
var productController = require('./shop/product-controller');

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

// body parser
app.use(bodyParser.json()); 

// log
app.use((request, response, next) => log(request, response, next));
function log(request, response, next)
{
  console.log(":: main", new Date(), request.url, request.method);
  next();
}

// routing
app.use("/api/shops", shopController);
app.use("/api/products", productController);

app.listen(8080);