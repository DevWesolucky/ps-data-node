class SqliteParser
{

    /**
     * Builds INSERT statement on the base of object fields.
     */
    static buildInsertStatemnt(obj, tableName) 
    {
        let stmt = "INSERT INTO " + tableName; 
        let columnNamesArr = [];
        let valuesArr = [];
        for (var prop in obj) 
        {
            // assumes that id is auto incremented and value should be base type
            if (prop == "id" || typeof(obj[prop]) === 'object') continue;
            let nameValueObj = SqliteParser.parsePropertyToDbObj(obj, prop);

            columnNamesArr.push(nameValueObj.fieldName);
            valuesArr.push(nameValueObj.filedValue);
        }

        stmt += " (" + columnNamesArr.join(",") + ")";
        stmt += " VALUES (" + valuesArr.join(",") + ")";
        return stmt;
    }

    /**
     * Builds UPDATE statement on the base of object fields.
     */
    static buildUpdateStatemnt(obj, tableName) 
    {
        let stmt = "UPDATE " + tableName + " SET ";
        let nameValuePart = "";

        for (var prop in obj)
        {
            // assumes that id is auto incremented and value should be base type
            if (prop == "id" || typeof(obj[prop]) === 'object') continue;

            if (nameValuePart.length > 0) nameValuePart += ", ";
            let nameValueObj = SqliteParser.parsePropertyToDbObj(obj, prop);
            nameValuePart += nameValueObj.fieldName + "=" + nameValueObj.filedValue;
        }

        stmt += nameValuePart;
        stmt += " WHERE ID=" + obj.id;

        return stmt;
    }

    /**
     * Converts string and boolean value to SQLite requirements.
     * Preserves cohesion with Hibernate default convention > camel notation
     * of field name to upper underscore column name.
     * 
     */
    static parsePropertyToDbObj(obj, prop)
    {
        // convert camel to underscore and upper case (like in Java Hibernate and H2, e.g. myField to MY_FIELD)
        let name = prop.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
        let value = obj[prop];
        if (typeof(value) === 'string')
        {
            // SQLite convention for escape single quote (doubled)
            value = value.replace("'", "''");
            value = "'" + value + "'";
        }
        if (typeof(value) === 'boolean')
        {
            // SQLite does not have a separate Boolean storage class. Instead, 
            // Boolean values are stored as integers 0 (false) and 1 (true). 
            value = value ? 1 : 0;
        }
        let nameValueObj = {fieldName: name, filedValue: value};
        return nameValueObj;
    }


    /**
     * Converts result object from SQLite to application object (Boolean and camel case)
     */
    static parseResultObj(obj)
    {
        let outputObj = {};
        for (var prop in obj) 
        {
            // convert upper case underscore to camel (e.g. MY_FIELD to myField)
            let name = prop.toLowerCase();
            name = name.replace(/[_]([a-z])/g, function (g) { return g[1].toUpperCase(); });

            let value = obj[prop]; 
            // TODO no chance to be typeof boolean from raw 0/1 value
            if (typeof(obj[prop]) === 'boolean')
            {
                // SQLite does not have a separate Boolean storage class. Instead, 
                // Boolean values are stored as integers 0 (false) and 1 (true). 
                value = (value == 1) ? true : false;
            }
            outputObj[name] = value;
        }
        return outputObj;
    }

}

module.exports = SqliteParser;

