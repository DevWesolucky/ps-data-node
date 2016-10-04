var express = require('express');
var router = express.Router();

var ShopService = require("./ShopService");
var shopService = new ShopService();
var _response;

// setup routing by request method (GET / POST / PUT) and parameters
router.get('/', (request, response) => getAllShops(request, response));
router.post('/', (request, response) => addNewShop(request, response));
router.put('/', (request, response) => updateShop(request, response));
router.get('/:id', (request, response) => getShopById(request, response));
router.delete('/:id', (request, response) => deleteShopById(request, response));

function getAllShops(request, response)
{
  _response = response; // preserves for async service result
  shopService.getAllShops();
}

function getShopById(request, response)
{
  _response = response;
  let id = request.params.id;
  shopService.getShopById(id);
}

function deleteShopById(request, response)
{
  _response = response;
  let id = request.params.id;
  shopService.deleteShopById(id);
}

function addNewShop(request, response)
{
  _response = response;
  if (request.body)
  {
    shopService.addNewShop(request.body);
  } else {
    onBadRequest("Can't find shop data in POST (add new shop) request.");
  }
}

function updateShop(request, response)
{
  _response = response;
  if (request.body)
  {
    shopService.updateShop(request.body);
  } else {
    onBadRequest("Can't find shop data in PUT (update shop) request.");
  }
}

// handle service events
shopService.eventEmitter.on('ReadSuccess', (res) => onReadSuccess(res));
shopService.eventEmitter.on('ChangeCompleted', () => onChangeCompleted());
shopService.eventEmitter.on('BadRequest', (msg) => onBadRequest(msg));

function onReadSuccess(result)
{
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
  if (!_response) return; // response is null at app start up > create table if not exists
  _response.status(200);
  _response.json({});
}


module.exports = router;