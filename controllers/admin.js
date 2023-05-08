const { validationResult } = require("express-validator")
const { ObjectId } = require("mongodb")
const Product = require("../models/Product")
const fileHelper = require("../util/file")
const ITEMS_PER_PAGE = 1

exports.getAddProduct =  function(req, res, next) { 
    res.render('admin/add-product',  {
        path: '/admin/add-product', 
        pageTitle: 'My Shop',
        productCSS: true, 
        formCSS: true, 
        activeAddProduct: true, 
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    })

}

exports.postAddProduct = function(req, res, next) {
    const errors =  validationResult(req)
    const title = req.body.title
    const image = req.file
    const price = req.body.price
    const description = req.body.description

    if (!image) {
        return res.status(422).render('admin/add-product',  {
             path: null, 
             pageTitle: 'Add Product',
             editing: false, 
             hasError: true, 
             product: {
                 title,
                 price,
                 description,
 
             },
             errorMessage: 'file attached is not an image',
             validationErrors: []
 
         })
     }

     const imageUrl = image.path

    if (!errors.isEmpty()) {
       return res.status(422).render('admin/add-product',  {
            path: null, 
            pageTitle: 'Add Product',
            editing: false, 
            hasError: true, 
            product: {
                title,
                price,
                description,

            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),

        })
    }

    const product = new Product({
    //   _id: new ObjectId("64060532c4095536b5f6c475"),
      title,
      imageUrl,
      description,
      price,
      userId: req.user._id,
    });
        product.save()
        .then(() => {
            console.log("Product Created");
            res.redirect('/')
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            console.log(err)
            return next(error)
        })

}

exports.getEditProduct =  function(req, res, next) { 
    const editMode = req.query.edit
    if (!editMode) {
        return res.redirect('/')
    }

    const prodId = req.params.id
    Product
        .findById(prodId)
        .then(product => {
            if (!product) {
                res.redirect('/')
            }

            res.render('admin/add-product',  {
                path: null, 
                pageTitle: 'Edit Product',
                editing: editMode, 
                product,
                isAuthenticated: req.session.isLoggedIn,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            console.log(err)
            return next(error)
        })

}


//Editing a product
exports.postEditProduct =  function(req, res, next) { 
    const id = req.body.prodId; 
    const title = req.body.title
    const image = req.file
    const price = req.body.price
    const description = req.body.description
    const errors =  validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/add-product',  {
             path: null, 
             pageTitle: 'Edit Product',
             editing: true, 
             hasError: true, 
             product: {
                 title,
                 price,
                 description,
                 _id: id
 
             },
             errorMessage: errors.array()[0].msg,
             validationErrors: errors.array(),
 
         })
     }



    Product.findById(id).then(product => {
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/')
        }
        product.description = description
        product.price = price
        product.title = title
        if(image) {
            fileHelper.deletePath(product.imageUrl)
            product.imageUrl = image.path
        }
        return product.save()
        .then((result) => {
            console.log('Updated Product!');
            res.redirect('/admin/products')
        })
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        console.log(err)
        return next(error)
    })
}


exports.getProducts = async (req, res, next) => { 
    const page = +req.query.page || 1

    const numberOfProducts = await Product.countDocuments()

    Product
        .find({userId: req.user._id})
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .then(products => {
            res.render('admin/products', 
            {
                products, 
                path: '/admin/products', 
                pageTitle: 'Admin Products', 
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < numberOfProducts,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(numberOfProducts / ITEMS_PER_PAGE)
            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            console.log(err)
            return next(error)
        })

}

// exports.postDeleteProduct = function (req, res, next) { 
//     const prodId = req.body.prodId; 

//     Product.findById(prodId).then(product => { 
//         if (!product) {
//             return next(new Error('Product not found'))
//         }
//         fileHelper.deletePath(product.imageUrl)

//         return  Product.deleteOne({_id: prodId, userId: req.user._id})
//     })
//         .then(() => {
//             console.log("Destroyed Product!");
//             res.redirect('/admin/products')

//         })
//         .catch(err => {
//             const error = new Error(err)
//             error.httpStatusCode = 500
//             console.log(err)
//             return next(error)
//         })

// }

exports.deleteProduct = function (req, res, next) { 
    const prodId = req.params.id; 

    Product.findById(prodId).then(product => { 
        if (!product) {
            return next(new Error('Product not found'))
        }
        fileHelper.deletePath(product.imageUrl)

        return  Product.deleteOne({_id: prodId, userId: req.user._id})
    })
        .then(() => {
            console.log("Destroyed Product!");
            res.status(200).json({message: 'Product deleted successfully'})

        })
        .catch(err => {
            res.status(500).json({message: 'Delete Product failed'})
        })

}