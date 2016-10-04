
var sqlite3 = require('sqlite3').verbose();
var EventEmitter = require('events').EventEmitter;

class SqliteDAO
{

    constructor(path)
    {
        this.eventEmitter = new EventEmitter();
        this.statementsCounter = 0;
        this.db = new sqlite3.Database(path);
        console.log(":: SqliteDAO consturctor > this.db: ", this.db);
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
            this.db.run(stmt, (err) => this.onChangeStatements(err));
        }
    }

    onChangeStatements(err)
    {
        this.statementsCounter--;
        if (err) 
        {
            console.log("SqliteDAO.onChangeStatements > error:", err);
            this.eventEmitter.emit("ChangeError", err);
        }
        // if all completed
        if (this.statementsCounter == 0)
        {
            this.eventEmitter.emit("ChangeCompleted");
        }
    }

    /**
     * Method for SELECT statement.
     */
    runReadStatement(statement)
    {
         this.db.all(statement, (err, rows) => this.onReadStatement(err, rows)); 
    }

    onReadStatement(err, rows)
    {
        console.log("--- SqliteDAO.onReadStatement ---");
        if(err)
        {
            this.eventEmitter.emit("ReadError", err);
        } else {
            this.eventEmitter.emit("ReadSuccess", rows);
        }
    }

}

module.exports = SqliteDAO;