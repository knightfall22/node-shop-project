const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
const Order = require("./Order");
const Product = require("./Product");

const Schema = mongoose.Schema

const userSchema = new Schema({
  password: { type: String, required: true },
  email: { type: String, required: true },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref:'Product' , required: true },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart =  function (product) {
        const cartProductIndex = this.cart.items.findIndex(
          (cartProduct) =>
            cartProduct.productId.toString() === product._id.toString()
        );
        let newQty = 1;
        const updatedCartItems = [...this.cart.items];

        if (cartProductIndex >= 0) {
          newQty = this.cart.items[cartProductIndex].quantity + 1;
          updatedCartItems[cartProductIndex].quantity = newQty;
        } else {
          updatedCartItems.push({
            productId: product._id,
            quantity: newQty,
          });
        }

        const updatedCart = {
            items: updatedCartItems
        }
        this.cart = updatedCart;
        return this.save();

}

userSchema.methods.deleteItemFromCart = function (prodId) { 
  
    const updatedCartItems = this.cart.items.filter(i => {
      console.log(prodId.toString(), i.productId.toString() );
      return i.productId.toString() !== prodId.toString()
    })

    this.cart.items = updatedCartItems

    console.log(updatedCartItems);
    return this.save();
}

// userSchema.methods.addOrder = function () {
//   const id = this.cart.items.map(i => i.productId).toString();
//   const quantity = this.cart.items.map(i => i.quantity).toString();

//   return Product.findById(id).then((product) => {
//      const order = new Order({products:[ {productData: product, quantity}], user: {userId: this._id, email: this.email} })
//      return order.save()
//   }).then(() => {
//     this.cart = {items: []}
//     return this.save()
//   });
// }

// Alternative Add to Orders
userSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema)
