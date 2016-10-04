var EventEmitter = require('events').EventEmitter;

var ShopSqliteDAO = require("./sqlite/ShopSqliteDAO");
var MySqlDAO = require("./mysql/MySqlDAO");
var Shop = require('./domain/Shop');

class ShopService
{

    constructor()
    {
        this.currentRequest = "";
        this.currentShop;
        this.eventEmitter = new EventEmitter();
        this.shopSqliteDAO = new ShopSqliteDAO();
        this.shopSqliteDAO.createTables(); // create tables if not exists

        this.mySqlDAO = new MySqlDAO();
        this.setupListeners();
    }
    

    getAllShops()
    {
        // TODO check concurrency issue
        this.shopSqliteDAO.getAllShops();
    }

    deleteShopById(id)
    {
        this.shopSqliteDAO.deleteShopById(id);
    }

    getShopById(id)
    {
        this.shopSqliteDAO.getShopById(id);
    }

    addNewShop(obj)
    {
        this.currentRequest = "addNewShop";
        let shop = new Shop(obj);
        shop.baseUrl = shop.httpsEnabled ? "https://" + shop.domain : "http://" + shop.domain;

        if (shop.id != 0)
        {
           let failureMsg = "A new shop cannot have an ID that already may exists > id: " + shop.id;
           this.eventEmitter.emit("BadRequest", failureMsg);
        } else {
            // add after test MySQL connection (only if success)
            this.testMySqlConnection(shop);
        }
    }

    updateShop(obj)
    {
        this.currentRequest = "updateShop";
        let shop = new Shop(obj);
        shop.baseUrl = shop.httpsEnabled ? "https://" + shop.domain : "http://" + shop.domain;
        // update after test MySQL connection (only if success)
        this.testMySqlConnection(shop);
    }

    // ::: MySQL connection :::

    testMySqlConnection(shop)
    {
        this.currentShop = shop; // preserve to update/add after MySQL connection success
        let mySqlParamsObj = {
            host     : shop.host,
            port     : shop.port,
            user     : shop.user,
            password : shop.password,
            database : shop.dbName
        };
        console.log("ShopService.testMySqlConnection > mySqlParamsObj:\n", mySqlParamsObj);
        this.mySqlDAO.connect(mySqlParamsObj);
    }

    onMySqlConnectSuccess()
    {
        console.log("ShopService.onMySqlConnectSuccess");
        switch(this.currentRequest)
        {
            case "addNewShop":
                this.shopSqliteDAO.addNewShop(this.currentShop);
                break;
            case "updateShop":
                this.shopSqliteDAO.updateShop(this.currentShop);
                break;
        }
        this.mySqlDAO.close();
    }

    onMySqlConnectError(err)
    {
        console.log("ShopService.onMySqlConnectError > err:", err);
        let failureMsg = "Can't connect to MySQL. " + err;
        this.eventEmitter.emit("BadRequest", failureMsg);
    }

    // ::: LISTENERS :::

    setupListeners()
    {
        this.shopSqliteDAO.eventEmitter.on('ChangeCompleted', () => this.onSqliteChangeCompleted());
        this.shopSqliteDAO.eventEmitter.on('ReadSuccess', (res) => this.onSqliteReadSuccess(res));
        this.shopSqliteDAO.eventEmitter.on('BadRequest', (res) => this.onSqliteBadRequest(res));

        this.mySqlDAO.eventEmitter.on('MySqlConnectSuccess', () => this.onMySqlConnectSuccess());
        this.mySqlDAO.eventEmitter.on('MySqlConnectError', (err) => this.onMySqlConnectError(err));
    }

    onSqliteChangeCompleted()
    {
        this.eventEmitter.emit('ChangeCompleted');
    }
    onSqliteReadSuccess(res)
    {
        this.eventEmitter.emit('ReadSuccess', res);
    }
    onSqliteBadRequest(res)
    {
        this.eventEmitter.emit('BadRequest', res);
    }

}

module.exports = ShopService;