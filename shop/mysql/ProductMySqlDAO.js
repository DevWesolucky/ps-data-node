var EventEmitter = require('events').EventEmitter;
var MySqlDAO = require("./MySqlDAO");
var ProductMySqlParser = require("./ProductMySqlParser");
var ShopSqliteDAO = require("../sqlite/ShopSqliteDAO");
var Shop = require("../domain/Shop");

class ProductMySqlDAO
{

    constructor()
    {
        this.eventEmitter = new EventEmitter();
        this.shopSqliteDAO = new ShopSqliteDAO("shops.sqlite");
        this.mySqlDAO = new MySqlDAO();
        this.setupProductTablesMap();
        this.setupListeners();
    }
    
    getAllProductsByShopId(shopId)
    {
        // get shop at first
        this.shopSqliteDAO.getShopById(shopId);
    }

    onSqliteReadSlectedShopSuccess(res)
    {
        this.currentShop = new Shop(res); // preserve to parse process
        let mySqlParamsObj = {
            host     : this.currentShop.host,
            port     : this.currentShop.port,
            user     : this.currentShop.user,
            password : this.currentShop.password,
            database : this.currentShop.dbName
        };
        console.log("ProductMySqlDAO.onSqliteReadSlectedShopSuccess > mySqlParamsObj:\n", mySqlParamsObj);
        this.mySqlDAO.connect(mySqlParamsObj);
    }

    onMySqlConnectSuccess()
    {
        this.prestaProductsArr = [];
        this.tableIndex = 0;
        this.readNextTable();
    }

    readNextTable()
    {
        let tableName = this.tablesObjArr[this.tableIndex].tableName;
        let tableColumnsArr = this.tablesObjArr[this.tableIndex].tableColumnsArr;
        let sql = "SELECT " + tableColumnsArr.join(",") + " FROM " + tableName;
        this.mySqlDAO.runReadStatement(sql);
    }

    onMySqlReadSuccess(rows)
    {
        let tableObj = this.tablesObjArr[this.tableIndex];
        console.log("--- " + this.tableIndex + " :: onMySqlReadSuccess", tableObj.tableName);
        console.log("onMySqlReadSuccess rows num:", rows.length);

        // collect results
        tableObj.rowsArr = rows;

        // if (rows.length && rows.length > 0) console.log("row:\n", rows[0]);
        this.tableIndex++;
        if (this.tableIndex < this.tablesObjArr.length)
        {
            this.readNextTable();
        } else {
            this.prestaProductsArr = ProductMySqlParser.parseMySqlResultsToProductsArr(this.currentShop, this.tablesObjArr);
            this.eventEmitter.emit('MySqlReadSuccess', this.prestaProductsArr);
        }
    }

    // ::: LISTENERS :::

    setupListeners()
    {
        this.shopSqliteDAO.eventEmitter.on('ReadSuccess', (res) => this.onSqliteReadSlectedShopSuccess(res));
        this.shopSqliteDAO.eventEmitter.on('BadRequest', (res) => this.onSqliteBadRequest(res));

        this.mySqlDAO.eventEmitter.on('MySqlConnectSuccess', () => this.onMySqlConnectSuccess());
        this.mySqlDAO.eventEmitter.on('MySqlConnectError', (err) => this.onMySqlConnectError(err));
        this.mySqlDAO.eventEmitter.on('MySqlReadSuccess', (rows) => this.onMySqlReadSuccess(rows));
        this.mySqlDAO.eventEmitter.on('MySqlReadError', (err) => this.onMySqlReadError(err));
    }


    onMySqlConnectError(err)
    {
        console.log("ShopService.onMySqlConnectError > err:", err);
        let failureMsg = "Can't connect to MySQL. " + err;
        this.eventEmitter.emit("BadRequest", failureMsg);
    }

    onMySqlReadError(err)
    {
        let failureMsg = "Read MySQL data error. " + err;
        this.eventEmitter.emit("BadRequest", failureMsg);  
    }

    onSqliteBadRequest(res)
    {
        this.eventEmitter.emit('BadRequest', res);
    }

	setupProductTablesMap()
	{
        this.tablesObjArr = [];

        let tableObj = {
            tableName: "ps_product_lang", 
            tableColumnsArr: ["id_product", "name", "link_rewrite"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_supplier", 
            tableColumnsArr: ["id_supplier", "name"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_tax", 
            tableColumnsArr: ["id_tax", "rate"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_attribute", 
            tableColumnsArr: ["id_attribute", "id_attribute_group"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_attribute_lang", 
            tableColumnsArr: ["id_attribute", "name"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_product_attribute_combination", 
            tableColumnsArr: ["id_product_attribute", "id_attribute"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_layered_indexable_attribute_group_lang_value", 
            tableColumnsArr: ["id_attribute_group", "url_name"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_product_attribute_image", 
            tableColumnsArr: ["id_image", "id_product_attribute"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_image", 
            tableColumnsArr: ["id_image", "id_product", "position"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_product", 
            tableColumnsArr: ["id_product", "reference", "id_category_default", "id_supplier", "id_tax_rules_group", 
				"visibility", "wholesale_price", "price", "ean13", "weight", "date_upd", "date_add"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_product_attribute", 
            tableColumnsArr: ["id_product", "id_product_attribute", "reference", "wholesale_price", "price", 
				"ean13", "weight", "default_on"]
        };
        this.tablesObjArr.push(tableObj);

        tableObj = {
            tableName: "ps_stock_available", 
            tableColumnsArr: ["id_product", "id_product_attribute", "quantity"]
        };
        this.tablesObjArr.push(tableObj);
		
	}


}

module.exports = ProductMySqlDAO;