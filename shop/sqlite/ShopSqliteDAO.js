var EventEmitter = require('events').EventEmitter;
var SqliteDAO = require("./SqliteDAO");
var SqliteParser = require("./SqliteParser");

class ShopSqliteDAO
{

    constructor()
    {
        this.currentRequest = "";
        this.eventEmitter = new EventEmitter();
        this.sqliteDAO = new SqliteDAO("shops.sqlite");
        this.setupListeners();
    }

    getAllShops()
    {
        this.currentRequest = "getAllShops";
        let stmt = "SELECT * FROM SHOP";
        this.sqliteDAO.runReadStatement(stmt);
    }

    getShopById(id)
    {
        this.currentRequest = "getShopById";
        let stmt = "SELECT * FROM SHOP WHERE ID=" + id;
        this.sqliteDAO.runReadStatement(stmt);
    }

    deleteShopById(id)
    {
        this.currentRequest = "deleteShopById";
        let stmt = "DELETE FROM SHOP WHERE ID=" + id;
        this.sqliteDAO.runChangeStatements([stmt]);
    }

    addNewShop(shop)
    {
        this.currentRequest = "addNewShop";
        let stmt = SqliteParser.buildInsertStatemnt(shop, "SHOP");
        this.sqliteDAO.runChangeStatements([stmt]);
    }

    updateShop(shop)
    {
        this.currentRequest = "updateShop";
        let stmt = SqliteParser.buildUpdateStatemnt(shop, "SHOP");
        this.sqliteDAO.runChangeStatements([stmt]);
    }


    setupListeners()
    {
        this.sqliteDAO.eventEmitter.on('ReadSuccess', (res) => this.onSqliteReadSuccess(res));
        this.sqliteDAO.eventEmitter.on('ReadError', (err) => this.onSqliteReadError(err));
        this.sqliteDAO.eventEmitter.on('ChangeCompleted', () => this.onSqliteChangeCompleted());
        this.sqliteDAO.eventEmitter.on('ChangeError', (err) => this.onSqliteChangeError(err));
    }

    onSqliteReadSuccess(res)
    {
        console.log("ShopSqliteDAO.onSqliteReadSuccess > res.length:", res.length, this.currentRequest);

        let parsedResArr = [];
        for (let i = 0; i < res.length; i++)
        {
            let parsedObj = SqliteParser.parseResultObj(res[i]);
            parsedResArr.push(parsedObj);
        }

        switch(this.currentRequest)
        {
            case "getShopById":
                if (parsedResArr.length == 0)
                {
                    let failureMsg = "Can't find shop";
                    this.eventEmitter.emit("BadRequest", failureMsg);
                } else {
                    this.eventEmitter.emit("ReadSuccess", parsedResArr[0]);
                }
                break;

            case "getAllShops":
                 this.eventEmitter.emit("ReadSuccess", parsedResArr);
                break;
               
        }
    }

    onSqliteChangeError(err)
    {
        console.log("ShopSqliteDAO.onSqliteChangeError > error:", err);
        this.eventEmitter.emit("BadRequest", err);
    }

    onSqliteChangeCompleted()
    {
        console.log("ShopSqliteDAO.onSqliteChangeCompleted");
        this.eventEmitter.emit("ChangeCompleted");
    }

    onSqliteReadError(err)
    {
        console.log("ShopSqliteDAO.onSqliteReadError > error:", err);
        this.eventEmitter.emit("BadRequest", err);
    }


    createTables()
    {
        let createStmtArr = [];
        createStmtArr.push(this.getCreateShopTableStatement());
        this.sqliteDAO.runChangeStatements(createStmtArr);
    }
    
    getCreateShopTableStatement()
    {
        let statement = "CREATE TABLE IF NOT EXISTS SHOP (";
        statement += "ID INTEGER PRIMARY KEY AUTOINCREMENT, "
        statement += "BASE_URL TEXT, DB_NAME TEXT, DOMAIN TEXT, HOST TEXT, ";
        statement += "HTTPS_ENABLED BOOLEAN, PASSWORD TEXT, PORT INTEGER, " ;
        statement += "REVERSE_ID_IN_URL BOOLEAN, USER TEXT";
        statement += ")";
        return statement;
    }



}

module.exports = ShopSqliteDAO;