const path = require('path');
const express = require('express')

const root = require('../util/path')

const router = express.Router()
const admin = require('./admin');
const { getProducts, getCart, getCheckout, getIndex, getOrders, getProduct, postCart, postDeleteCart, postOrder, getInvoice } = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

router.get('/', getIndex)

router.get('/products', getProducts)

router.get('/products/:id', getProduct)

router.get('/cart',  isAuth, getCart)

router.post('/cart', isAuth, postCart)

router.post('/delete-cart-item', isAuth, postDeleteCart)

router.get('/checkout', isAuth, getCheckout)

router.get('/checkout/success', postOrder)
router.get('/checkout/cancel', getCheckout)

router.get('/orders', isAuth, getOrders)

router.post('/create-order', isAuth, postOrder)

router.get('/orders/:id', getInvoice)


// router.get('/checkout', getCheckout)

module.exports = router