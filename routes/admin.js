const path = require('path');
const express = require('express')

const root = require('../util/path');
const { getAddProduct, postAddProduct, getProducts, getEditProduct, postEditProduct, postDeleteProduct, deleteProduct } = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const { body } = require('express-validator');

const router = express.Router()


router.get('/admin/products', isAuth, getProducts)

router.get('/admin/add-product', isAuth, getAddProduct)

router.post('/admin/add-product', [
    body('title')
        .isString()
        .isLength({min: 3})
        .trim(),

    body('price')
        .isFloat(),

    body('description')
        .isLength({min: 5, max: 1000})
        .trim(),
    


], isAuth, postAddProduct)

router.get('/admin/edit-product/:id',  isAuth, getEditProduct)

router.post('/admin/edit-product',[
    body('title')
        .isString()
        .isLength({min: 3})
        .trim(),

    body('price')
        .isFloat(),

    body('description')
        .isLength({min: 5, max: 400})
        .trim(),
    


],  isAuth, postEditProduct)

router.delete('/admin/delete-product/:id',  isAuth, deleteProduct)

module.exports = router
