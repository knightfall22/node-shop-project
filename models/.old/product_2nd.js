// const { ObjectId } = require("mongodb")
// const { getDb } = require("../util/database")

// class Product {
//   constructor(id, title, imageUrl, description, price, userId){
//       this._id = id ? new ObjectId(id) : null;
//       this.title = title
//       this.imageUrl = imageUrl
//       this.description = description
//       this.price = price
//       this.userId = userId;
//   }

//   save() {
//     const db = getDb()
//     let dbOp;
//     if (this._id) {
//       //Update the product
//       dbOp = db.collection('products').updateOne({_id: new ObjectId(this._id)}, {$set: this})
//     } else { 
//       dbOp = db.collection('products').insertOne(this)
//     }
//     return dbOp
//       .then(result => console.log(result))
//       .catch(err => console.error(err))
//   }

//   static fetchAll () {
//     const db = getDb()
//     return db.collection("products").find().toArray()
//       .then(products => {
//         console.log(products);
//         return products
//       })
//       .catch(err => console.error(err))
//   }

//   static fetchProduct (prodId) {
//     const db = getDb()
//     return db.collection("products").find({_id: new ObjectId(prodId)})
//       .next()
//       .then(product => {
//         return product
//       })
//       .catch(err => console.log(err))  
//     }

//   static deleteById(id) { 
//     const db = getDb()
//     return db.collection("products").deleteOne({_id: new ObjectId(id)})
//     .then(product => {
//       console.log('Item deleted successfully');
//     })
//     .catch(err => console.log(err))  
//   }
// }

// module.exports = Product