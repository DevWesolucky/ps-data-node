var EventEmitter = require('events').EventEmitter;
var ProductMySqlDAO = require('./mysql/ProductMySqlDAO');

class ProductService
{
    constructor()
    {
        // cache for request, shopId as key, productsArr as value
        this.shopProductsMap = new Object();
        this.currentRequest = "";
        this.eventEmitter = new EventEmitter();
        this.productMySqlDAO = new ProductMySqlDAO();
        // this.productSqliteDAO.createTables(); // create tables if not exists
        this.setupListeners();
    }

    getAllProductsByShopId(shopId)
    {
        console.log("ProductService.getAllProductsByShopId", shopId);
        this.currentRequest = "getAllProductsByShopId";
        this.currentShopId = shopId;
        let productsArr = this.shopProductsMap[shopId];
        if (productsArr)
        {
            this.eventEmitter.emit('ReadSuccess', productsArr);
        } else {
            this.productMySqlDAO.getAllProductsByShopId(shopId);
        }
    }

    getProductByShopIdAndId(shopId, id)
    {
        this.currentRequest = "getProductByShopIdAndId";
        this.currentShopId = shopId;
        this.currentId = id;
        let productsArr = this.shopProductsMap[shopId];
        if (productsArr)
        {
            let product = this.getProductById(productsArr, id);
            if (product)
            {
                this.eventEmitter.emit('ReadSuccess', product);
            } else {
                let failureMsg = "Can't find product for shopId: " + shopId + " and product id: " + id;
                this.eventEmitter.emit("BadRequest", failureMsg);
            }
        } else {
            // no cached data so run get all products process for the shop
            this.productMySqlDAO.getAllProductsByShopId(shopId);
        }
    }

    getProductById(productsArr, id)
    {
        for (let i = 0; i < productsArr.length; i ++)
        {
            let product = productsArr[i];
            if (product.id == id) return product;
        }
        return null;
    }


    setupListeners()
    {
        this.productMySqlDAO.eventEmitter.on('MySqlReadSuccess', (res) => this.onMySqlReadSuccess(res));
        this.productMySqlDAO.eventEmitter.on('BadRequest', (res) => this.onBadRequest(res));
    }

    onMySqlReadSuccess(res)
    {
        this.shopProductsMap[this.currentShopId] = res;
        if (this.currentRequest == "getProductByShopIdAndId")
        {
            this.getProductByShopIdAndId(this.currentShopId, this.currentId);
        } else {
            this.eventEmitter.emit('ReadSuccess', res);
        }
        
    }

    onBadRequest(res)
    {
        this.eventEmitter.emit('BadRequest', res);
    }



}

module.exports = ProductService;