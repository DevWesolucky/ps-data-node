var express = require('express');
var router = express.Router();

var ProductService = require("./ProductService");
var productService = new ProductService();
var _response;

// setup routing
router.get('/shop/:shopId', (request, response) => getAllProductsByShopId(request, response));
router.get('/shop/:shopId/product/:id', (request, response) => getProductByShopIdAndId(request, response));
router.get('/presta/shop/:shopId', (request, response) => getPrestaProductsByShopId(request, response));


function getAllProductsByShopId(request, response)
{
  _response = response; // preserves for async service result
  let shopId = request.params.shopId;
  console.log(":: getAllProductsByShopId > shopId:", shopId);
  productService.getAllProductsByShopId(shopId);
}

function getProductByShopIdAndId(request, response)
{
  _response = response;
  let shopId = request.params.shopId;
  let id = request.params.id;
  productService.getProductByShopIdAndId(shopId, id);
}

function getPrestaProductsByShopId(request, response)
{
  _response = response; // preserves for async service result
  let shopId = request.params.shopId;
  onBadRequest("Enforce geting fresh PrestaShop data not yet implemented.");
}

// handle service events
productService.eventEmitter.on('ReadSuccess', (res) => onReadSuccess(res));
productService.eventEmitter.on('ChangeCompleted', () => onChangeCompleted());
productService.eventEmitter.on('BadRequest', (msg) => onBadRequest(msg));

function onReadSuccess(result)
{
  console.log("product-controller onReadSuccess");
  _response.status(200);
  _response.json(result);
}

function onBadRequest(msg)
{
  _response.status(400);
  _response.json({message: msg});
}

function onChangeCompleted()
{
  if (!_response) return; // create table if not exists at start so check is null (response enabled)
  _response.status(200);
  _response.json({});
}

module.exports = router;