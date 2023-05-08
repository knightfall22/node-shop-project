// const { ObjectId } = require("mongodb");
// const { getDb } = require("../util/database");

// class User {
//   constructor(id, username, email, cart) {
//     this._id = id;
//     this.name = username;
//     this.email = email;
//     this.cart = cart; //{items: []}
//   }

//   save() {
//     const db = getDb();

//     return db
//       .collection("users")
//       .insertOne(this)
//       .then((result) => console.log(result))
//       .catch((err) => console.error(err));
//   }

//   addToCart(product) {
//     const db = getDb();
//     const cartProductIndex = this.cart.items.findIndex(
//       (cartProduct) =>
//         cartProduct.productId.toString() === product._id.toString()
//     );
//     let newQty = 1;
//     let updatedCartItems = [...this.cart.items];

//     if (cartProductIndex >= 0) {
//       newQty = this.cart.items[cartProductIndex].quantity + 1;
//       updatedCartItems[cartProductIndex].quantity = newQty;
//     } else {
//       updatedCartItems.push({
//         productId: new ObjectId(product._id),
//         quantity: newQty,
//       });
//     }

//     const updatedCart = {
//       items: updatedCartItems,
//     };
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: updatedCart } }
//       );
//   }

//   getCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map((i) => {
//       return i.productId;
//     });
//     return db
//       .collection("products")
//       .find({ _id: { $in: productIds } })
//       .toArray()
//       .then((products) => {
//         return products.map(p => {
//           return {
//             ...p,
//             quantity: this.cart.items.find(i => {
//               return i.productId.toString() === p._id.toString()
//             }).quantity
//           }
//         })
//       });

//   }

//   addOrder() {
//     const db = getDb();
//     return this.getCart().then(products => {
//       const order = {
//         items: products,
//         user: {
//           _id: new ObjectId(this._id),
//           name: this.name
//         }
//       }
//       return db
//         .collection('orders')
//         .insertOne(order)
//     })
//       .then(result => {
//         this.cart = {items: []}
//         return db
//           .collection('users')
//           .updateOne(
//             {_id: new ObjectId(this._id)},
//             { $set: {cart: {items: []}}}
//           )
//       })
//   }

//   getOrders () {
//     const db = getDb()
//     return db
//       .collection('orders')
//       .find({'user._id': new ObjectId(this._id)})
//       .toArray()
//   }

//   deleteItemFromCart(prodId) {
//     const db = getDb();

//     const updatedCartItems = this.cart.items.filter(i => {
//       console.log(prodId, i.productId );
//       return i.productId.toString() !== prodId.toString()
//     })

//     return db
//     .collection("users")
//     .updateOne(
//       { _id: new ObjectId(this._id) },
//       { $set: { cart: {items: updatedCartItems} } }
//     );
//   }

//   static findById(id) {
//     const db = getDb();
//     return db
//       .collection("users")
//       .findOne({ _id: new ObjectId(id) })
//       .catch((err) => console.log(err));
//   }
// }
// module.exports = User;
