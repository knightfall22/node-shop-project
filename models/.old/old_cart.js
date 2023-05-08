const fs = require('fs');
const path = require('path');
const pathUtils = require('../util/path');
const p = path.join(pathUtils, 'data', 'cart.json')

module.exports = class Cart {
    static addProduct (id, productPrice) {
        let cart = {products: [], totalPrice: 0}
        //Fetch previous cart
        fs.readFile(p, (err, fileContent) => { 
            if (!err) {
                cart = JSON.parse(fileContent)
            }
            //Anallyze cart and find exisitng products
            const exisitngProductIndex = cart.products.findIndex(product => product._id === id)
            const exisitngProduct = cart.products[exisitngProductIndex]

            //Add new product/ increasing the quality
            let updatedProduct;
            if (exisitngProduct) {
                updatedProduct = {...exisitngProduct}
                updatedProduct.qty = updatedProduct.qty + 1
                cart.products = [...cart.products]
                cart.products[exisitngProductIndex] = updatedProduct;
            } else{
                updatedProduct = {id: id, qty:1}
                cart.products = [...cart.products, updatedProduct]
            }

            cart.totalPrice = cart.totalPrice + +productPrice

            fs.writeFile(p, JSON.stringify(cart), err => { 
                console.log(err);
            })
        })
    }

    static deleteProduct(id, productPrice) {
        fs.readFile(p, (err, fileContent) => {  
            if (err) {
                return
            }
            const cart = JSON.parse(fileContent)
            const updatedCart = {...cart} 
            const product = updatedCart.products.find(p => p.id === id)

            if (!product) {
                return
            }
            const productQty = product.qty
            updatedCart.products = updatedCart.products.filter(p => p.id !== id)
            updatedCart.totalPrice = updatedCart.totalPrice - (productQty * productPrice)

            
            fs.writeFile(p, JSON.stringify(updatedCart), err => { 
                console.log(err);
            })
        })
    }

    static getCart (cb) {
        fs.readFile(p, (err, fileContent) => {  
            const cart = JSON.parse(fileContent)
            if (!cart) {
                cb(null)
            } else {
                cb(cart)
            }
        })
    }

}