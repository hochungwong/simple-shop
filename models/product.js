const fs = require("fs");
const path = require("path");

const p = path.join(path.dirname(process.mainModule.filename), 'data', 'products.json');

const getProductsFromFile = callBack => {
    fs.readFile(p, (err, fileContent) => {
        if (err) {
            return callBack([]);
        } else {
            callBack(JSON.parse(fileContent));
        }
    });
};

module.exports = class Product {
    constructor(id, title, imageUrl, description, price) {
        this.id = id;
        this.title = title;
        this.imageUrl = imageUrl;
        this.description = description;
        this.price = price;
    }

    save() {

        getProductsFromFile(products => {
            //existing product
            if (this.id) {
                const existingProductIndex = products.findIndex(prod => prod.id === this.id);
                const updatedProducts = [...products];
                updatedProducts[existingProductIndex] = this;
                fs.writeFile(p, JSON.stringify(updatedProducts), err => {
                    console.log(err);
                });
            } else {
                this.id = Math.random().toString();
                products.push(this);//refer to the class
                fs.writeFile(p, JSON.stringify(products), err => {
                    console.log(err);
                });
            }
        });
    }

    static fetchAll(callBack) {
        getProductsFromFile(callBack);
    }

    static findProdById(id, callBack) {
        getProductsFromFile(products => {
            const product = products.find(p => p.id === id);
            callBack(product);
        });
    }
};