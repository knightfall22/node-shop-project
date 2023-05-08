const path = require("path");
const fs = require("fs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Order = require("../models/Order");
const Product = require("../models/Product");
const user = require("../models/user");
const pdfDocument = require("pdfkit");
const session = require("express-session");
const ITEMS_PER_PAGE = 1

exports.getProducts = async (req, res, next) => {
  const page = +req.query.page || 1

  const numberOfProducts = await Product.countDocuments()

  Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .then((products) => {
      res.render("shop/product_list", {
        products,
        path: "/products",
        pageTitle: "All Products",
        pageTitle: "My Shop",
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < numberOfProducts,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(numberOfProducts / ITEMS_PER_PAGE)
      });
    })
    .catch((err) => console.error(err));
};

exports.getProduct = function (req, res, next) {
  const prodId = req.params.id;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product_details", {
        product: product,
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.error(err));
};

exports.getIndex = async (req, res, next) => {
  const page = +req.query.page || 1

  const numberOfProducts = await Product.countDocuments()

  console.log( ITEMS_PER_PAGE * page < numberOfProducts)
  Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .then((products) => {
      res.render("shop/index", {
        products,
        path: "/",
        pageTitle: "My Shop",
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < numberOfProducts,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(numberOfProducts / ITEMS_PER_PAGE)
      });
    })
    .catch((err) => console.error(err));
};

exports.getCart = function (req, res, next) {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      console.log(products);
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "My Cart",
        products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      console.log(err);
      return next(error);
    });
};

exports.postCart = function (req, res, next) {
  const prodId = req.body.prodId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postDeleteCart = function (req, res, next) {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(() => res.redirect("/cart"))
    .catch((err) => console.log(err));
  // Product.fetchById(prodId, product => {
  //     Cart.deleteProduct(prodId,product.price)
  //     res.redirect('/cart')
  // })
};

exports.getCheckout = function(req, res, next) {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.forEach((product) => {
        total += product.quantity * product.productId.price;
      })

      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map((product) => {
          return {
            name: product.productId.title,
            description: product.productId.description,
            amount: product.productId.price * 100,
            currency: 'usd',
            quantity: product.quantity

          }
        }),
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url:  req.protocol + '://' + req.get('host') + '/checkout/cancel',
      })
    })
    .then(session => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "My checkout",
        products,
        total,
        sessionId: session.id
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      console.log(err);
      return next(error);
    });
}

// exports.postOrder = function(req, res, next) {
//     let fetchedCart;
//     req.user
//         .addOrder()
//         .then(() => {
//             res.redirect('/')

//         })
//         .catch(err => console.log(err));
// }

//Alternative Add to Orders
exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, productData: { ...i.productId._doc } };
      });
      console.log(products);
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => console.log(err));
};

exports.getOrders = function (req, res, next) {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Orders",
        orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};

exports.getInvoice = function (req, res, next) {
  const orderId = req.params.id;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("Order not found"));
      }

      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new pdfDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoicePath + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("invoice", {
        underline: true,
      });
      pdfDoc.text("-----------------------------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        console.log(prod.productData.price);
        totalPrice += prod.quantity * prod.productData.price;
        pdfDoc
          .fontSize(14)
          .text(
            `${prod.productData.title} - ${prod.quantity} x $${prod.productData.price}`
          );
      });
      pdfDoc.text("---------------------");
      pdfDoc.fontSize(20).text(`Total price: ${totalPrice}`);

      pdfDoc.end();

      // fs.readFile(invoicePath, (err, data) => {
      //     if (err) {
      //         return next(err);
      //     }
      //     res.setHeader('Content-Type', 'application/pdf')
      //     res.setHeader('Content-Disposition', 'inline; filename="' + invoicePath + '"')
      //     res.send(data);
      // })

      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    })
    .catch((err) => {
      console.error(err);
    });
};
