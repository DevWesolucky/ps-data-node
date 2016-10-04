var mysql = require('mysql');
var EventEmitter = require('events').EventEmitter;

class MySqlDAO
{
    constructor()
    {
        this.connection = null;
        this.statementsCounter = 0;
        this.eventEmitter = new EventEmitter();
    }

    connect(mySqlParamsObj)
    {
        // console.log("MySqlDAO.connect > connection:", this.connection);
        console.time("MySqlDAO.connect > time:");
        console.log("MySqlDAO.connect > host:", mySqlParamsObj.host);

        this.connection = mysql.createConnection(mySqlParamsObj);
        this.connection.connect((err) => this.onConnect(err));
    }

    onConnect(err)
    {
        console.timeEnd("MySqlDAO.connect > time:");
        if (err)
        {
            this.eventEmitter.emit("MySqlConnectError", err);
        } else {
            console.log("MySqlDAO.onConnect > threadId:", this.connection.threadId);
            this.eventEmitter.emit("MySqlConnectSuccess");
        }
    }

    close()
    {
        this.connection.end((err) => this.onDisconnect(err));
    }

    onDisconnect(err)
    {
        if (err)
        {
            console.error("MySqlDAO.onDisconnect > error:", err);
        } else {
            // console.log("MySqlDAO.onDisconnect > connection:", this.connection);
            console.log("MySqlDAO.onDisconnect");
        }
    }

    /**
     * Method for SELECT statement.
     */
    runReadStatement(statement)
    {
         this.connection.query(statement, (err, rows) => this.onReadStatement(err, rows)); 
    }

    onReadStatement(err, rows)
    {
        console.log("--- MySqlDAO.onReadStatement ---");
        if(err)
        {
            console.error("MySqlDAO.onReadStatement > error:", err);
            this.eventEmitter.emit("MySqlReadError", err);
        } else {
            this.eventEmitter.emit("MySqlReadSuccess", rows);
        }
    }

    /**
     * Method for CREATE, UPDATE and INSERT statements.
     */
    runChangeStatements(statementsArr)
    {
        this.statementsCounter = statementsArr.length;
        for (let i = 0; i < statementsArr.length; i++)
        {
            let stmt = statementsArr[i];
            this.connection.query(stmt, (err) => this.onChangeStatements(err));
        }
    }

    onChangeStatements(err)
    {
        this.statementsCounter--;
        if (err) 
        {
            console.error("MySqlDAO.onChangeStatements > error:", err);
            this.eventEmitter.emit("MySqlChangeError", err);
        }
        if (this.statementsCounter == 0)
        {
            this.eventEmitter.emit("MySqlChangeCompleted");
        }
    }

}

module.exports = MySqlDAO;