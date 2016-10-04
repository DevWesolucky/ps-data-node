class Shop 
{
    constructor(obj)
    {
        this.id = obj.id || 0;
        this.domain = obj.domain || "";
        this.reverseIdInUrl = obj.reverseIdInUrl || false;
        
        this.host = obj.host || "";
        this.port = obj.port || 3306;
        this.user = obj.user || "";
        this.password = obj.password || "";
        this.dbName = obj.dbName || "";

        this.httpsEnabled = obj.httpsEnabled || false; 
        this.baseUrl = obj.baseUrl || ""; // protocol (http or https) + domain
    }
}

module.exports = Shop;