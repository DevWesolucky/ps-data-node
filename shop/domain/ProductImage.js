
class ProductImage
{

    constructor(obj)
    {
        this.id = obj.id || 0;
        this.shopId = obj.shopId || 0;
        this.imgId = obj.imgId || 0;
        this.productId = obj.productId || 0;
        this.attributeProductId = obj.attributeProductId || 0;
        this.position = obj.position || 0;
        this.url = obj.url || "";
    }

}

module.exports = ProductImage;