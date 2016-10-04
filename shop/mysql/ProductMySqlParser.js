
var Product = require('../domain/Product');
var ProductImage = require('../domain/ProductImage');
var prestaProductsArr;

class ProductMySqlParser
{
    
    static parseMySqlResultsToProductsArr(shop, tablesObjArr)
    {
        prestaProductsArr = [];
        // map with productId as key and main product as value
        let mainProductsMap = this.parsePsProduct(shop, tablesObjArr);
        // map with attributeProductId as key and main product as value
        // TODO add service for more than one attribute combination
        let attrProductsMap = this.parsePsProductAttribute(shop, tablesObjArr, mainProductsMap);

        this.parseImagesData(shop, tablesObjArr, mainProductsMap, attrProductsMap);

        prestaProductsArr.sort(function (x, y) { return x.productId - y.productId 
                                                || x.attributeProductId - y.attributeProductId; });
                                                
        for (let i = 0; i < prestaProductsArr.length; i++)
        {
            prestaProductsArr[i].id = i + 1; // override id to sorted array
        }
        return prestaProductsArr;
    }

    static parsePsProduct(shop, tablesObjArr)
    {
        // id_product as key, object with name and link_rewrite as value
        let psProductLangMap = this.getPsProductLangMap(tablesObjArr);
        // id_supplier as key, supplier name as value
        let psSupplierMap = this.getPsSupplierMap(tablesObjArr);

        let psProductRows = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_product");

        // map with productId as key and main product as value
        let mainProductsMap = new Object();

        for (let i=0; i < psProductRows.length; i++)
        {
            let row = psProductRows[i];
            let mainProduct = new Product({});
            mainProduct.shopId = shop.id;
            mainProduct.productId = row.id_product;
            mainProduct.code = row.reference;
            mainProduct.visibility = row.visibility;
            mainProduct.name = psProductLangMap[mainProduct.productId].name;

            mainProduct.linkRewrite = psProductLangMap[mainProduct.productId].link_rewrite;
            let urlIdPart =  mainProduct.productId + "-" +  mainProduct.linkRewrite; // default in PresstaShop
			if (shop.reverseIdInUrl) urlIdPart = mainProduct.linkRewrite + "-" + mainProduct.productId;
            mainProduct.url = shop.baseUrl + "/" + urlIdPart + ".html";

            // use supplier name as id (in presta db id_supplier is integer)
            mainProduct.supplierId = psSupplierMap[row.id_supplier];

            mainProduct.wholesaleNettoPrice = row.wholesale_price;
            mainProduct.nettoPrice = row.price;
            mainProduct.ean = row.ean13;
            mainProduct.weight = row.weight;
            mainProduct.dateUpdate = row.date_upd;
            mainProduct.dateAdd = row.date_add;

            // main product id as key, main product as value
            mainProductsMap[mainProduct.productId] = mainProduct;
            // **** TEMP
            mainProduct.id = prestaProductsArr.length + 1;
            prestaProductsArr.push(mainProduct);

            if (i > 2) continue;
            console.log("-- " + i + " main name: " + mainProduct.name);
        }

        return mainProductsMap;
    }

    static parsePsProductAttribute(shop, tablesObjArr, mainProductsMap)
    {
        let psProductAttributeCombinationMap = this.getPsProductAttributeCombinationMap(tablesObjArr);
        let psAttributeLangMap = this.getPsAttributeLangMap(tablesObjArr);
        let psAttributeMap = this.getPsAttributeMap(tablesObjArr);
        let psLayeredIndexableAttributeGroupLangValueMap = this.getPsLayeredIndexableAttributeGroupLangValueMap(tablesObjArr);
        
        let psProductRows = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_product_attribute");

        // map with attributeProductId as key and main product as value
        let attrProductsMap = new Object();
        for (let i=0; i < psProductRows.length; i++)
        {
            let row = psProductRows[i];
            // get parent / main product by product id
            let mainProduct = mainProductsMap[row.id_product];
            if (!mainProduct) continue;
            mainProduct.hasChildren = true;

            let attrProduct = new Product(mainProduct);
            attrProduct.hasChildren = false;
            attrProduct.attributeProductId = row.id_product_attribute;
            attrProduct.code = row.reference;
            attrProduct.wholesaleNettoPrice = row.wholesale_price;
            attrProduct.nettoPrice = row.price;
            attrProduct.ean = row.ean13;
            attrProduct.weight = row.weight;
            attrProduct.attributeProductDefaultOn = row.default_on;

            attrProduct.attributeId = psProductAttributeCombinationMap[attrProduct.attributeProductId];
            attrProduct.attributeName = psAttributeLangMap[attrProduct.attributeId];

            // retrives absolute url to the attribute product
            let attributeGroupIdValue = psAttributeMap[attrProduct.attributeId];
            let attrUrlName = psLayeredIndexableAttributeGroupLangValueMap[attributeGroupIdValue];

            if (attrUrlName && attrUrlName != "") 
            {
                attrUrlName = attrUrlName.replace("-", "_");
                // product.setUrl(product.getUrl() + "#/" + product.getAttributeId() + "-" + attrUrlName);
                attrProduct.url = attrProduct.url + "#/" + attrProduct.attributeId + "-" + attrUrlName;
            }

            attrProductsMap[attrProduct.attributeProductId] = attrProduct;
            // **** TEMP
            attrProduct.id = prestaProductsArr.length + 1;
            prestaProductsArr.push(attrProduct);

            if (i > 2) continue;
            let log = "\t" + i + " name: " + attrProduct.name;
            log += " | attributeId: " + attrProduct.attributeId;
            log += " | attributeName: " + attrProduct.attributeName;
            log += " | url: " + attrProduct.url;

            console.log(log);
            
        }
        return attrProductsMap;
    }

    static parseImagesData(shop, tablesObjArr, mainProductsMap, attrProductsMap)
    {
        // imgId as key, ProductImage as value
        let imagesMap = {};

        // container for all images with redundant data, but simplest to retrive
        let allImagesArr = [];

        let psImageRows = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_image");
        for (let i=0; i < psImageRows.length; i++)
        {
            let row = psImageRows[i];
            let mainProduct = mainProductsMap[row.id_product];
            if (!mainProduct) continue;
            let productImage = new ProductImage({});
            productImage.shopId = shop.id;
            productImage.imgId = row.id_image;
            productImage.productId = row.id_product;
            productImage.position = row.position;
            // shop.getBaseUrl() + "/" + entry.getKey() + PHOTO_SIZE + "/" + product.getLinkRewrite() + ".jpg";
            productImage.url = shop.baseUrl + "/" + productImage.imgId + "-large_default" 
                                + "/" + mainProduct.linkRewrite + ".jpg";

            mainProduct.productImagesArr.push(productImage);

            imagesMap[productImage.imgId] = productImage;
            allImagesArr.push(productImage);

        }

        let psAttributeImageRows = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_product_attribute_image");
        for (let i=0; i < psAttributeImageRows.length; i++)
        {
            let row = psAttributeImageRows[i];
            let attrProduct = attrProductsMap[row.id_product_attribute];
            if (!attrProduct) continue;
            // create new ProductImage on the base of exist one and add attributeProductId (default 0)
            let productImage = new ProductImage(imagesMap[row.id_image]);
            productImage.attributeProductId = row.id_product_attribute;

            attrProduct.productImagesArr.push(productImage);

            allImagesArr.push(productImage);
        }

    }

    static getPsProductLangMap(tablesObjArr)
    {
        let rowsArr = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_product_lang");
        let map = new Object();
        for (let i=0; i < rowsArr.length; i++)
        {
            let row = rowsArr[i];
            map[row.id_product] = {name: row.name, link_rewrite: row.link_rewrite};
        }
        return map;
    }

    static getPsSupplierMap(tablesObjArr)
    {
        let rowsArr = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_supplier");
        let map = new Object();
        for (let i=0; i < rowsArr.length; i++)
        {
            let row = rowsArr[i];
            map[row.id_supplier] = row.name;
        }
        return map;
    }

    static getPsProductAttributeCombinationMap(tablesObjArr)
    {
        let rowsArr = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_product_attribute_combination");
        let map = new Object();
        for (let i=0; i < rowsArr.length; i++)
        {
            let row = rowsArr[i];
            map[row.id_product_attribute] = row.id_attribute;
        }
        return map;
    }

    static getPsAttributeLangMap(tablesObjArr)
    {
        let rowsArr = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_attribute_lang");
        let map = new Object();
        for (let i=0; i < rowsArr.length; i++)
        {
            let row = rowsArr[i];
            map[row.id_attribute] = row.name;
        }
        return map;
    }

    static getPsAttributeMap(tablesObjArr)
    {
        let rowsArr = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_attribute");
        let map = new Object();
        for (let i=0; i < rowsArr.length; i++)
        {
            let row = rowsArr[i];
            map[row.id_attribute] = row.id_attribute_group;
        }
        return map;
    }

    static getPsLayeredIndexableAttributeGroupLangValueMap(tablesObjArr)
    {
        let rowsArr = this.getTableObjRowsArrByTableName(tablesObjArr, "ps_layered_indexable_attribute_group_lang_value");
        let map = new Object();
        for (let i=0; i < rowsArr.length; i++)
        {
            let row = rowsArr[i];
            map[row.id_attribute_group] = row.url_name;
        }
        return map;
    }

    static getTableObjRowsArrByTableName(tablesObjArr, tableName)
    {
        let tableObj = this.getTableObjByTableName(tablesObjArr, tableName);
        if (tableObj) return tableObj.rowsArr;
        return [];
    }

    static getTableObjByTableName(tablesObjArr, tableName)
    {
        for (let i=0; i < tablesObjArr.length; i++)
        {
            if (tablesObjArr[i].tableName == tableName) return tablesObjArr[i];
        }
        return null;
    }

}

module.exports = ProductMySqlParser;