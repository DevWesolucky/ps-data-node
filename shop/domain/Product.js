class Product
{
    constructor(obj)
    {
        this.id = obj.id || 0;
        
        this.productId = obj.productId || 0;
        this.code = obj.code || "";
        
        this.supplierId = obj.supplierId || "";
        this.name = obj.name || "";
        this.linkRewrite = obj.linkRewrite || "";
        this.url = obj.url || "";
        
        this.attributeProductId = obj.attributeProductId || 0;
        this.attributeProductDefaultOn = obj.attributeProductDefaultOn || 0;
        
        this.attributeId = obj.attributeId || 0;
        this.attributeName = obj.attributeName || "";
        
        this.ean = obj.ean || "";
        this.producer = obj.producer || "";
        this.weight = obj.weight || 0;
        
        this.visibility = obj.visibility || "";
        this.availability = obj.availability || 0;
        
        this.vatPercent = obj.vatPercent || 0;
        this.wholesaleNettoPrice = obj.wholesaleNettoPrice || 0;
        this.nettoPrice = obj.nettoPrice || 0;
        
        this.dateAdd = obj.dateAdd || "";
        this.dateUpdate = obj.dateUpdate || "";
        
        this.shopId = obj.shopId || 0;
        
        this.hasChildren = obj.hasChildren || false;

        // array of ProducImages objects
        this.productImagesArr = [];
    }
}

module.exports = Product;