const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product", //ref to Product model, same config with product model
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    //existing items and calculate the quantity
    updatedCartItems[cartProductIndex].quantity =
      this.cart.items[cartProductIndex].quantity + 1;
  } else {
    //new items
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  //     //filter the survived items
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

//clear cart after creating order
userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);

// const getDb = require("../util/mongodb").getDb;
// const mongodb = require("mongodb");

// const ObjectId = mongodb.ObjectId;

// class User {
//   constructor(username, email, cart, id) {
//     this.username = username;
//     this.email = email;
//     this.cart = cart; // {items: []}
//     this._id = id;
//   }

//   save() {
//     const db = getDb();
//     return db
//       .collection("users")
//       .insertOne(this)
//       .then(user => {})
//       .catch(err => {
//         console.log(err);
//       });
//   }

//   addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex(cp => {
//       return cp.productId.toString() === product._id.toString();
//     });
//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items];

//     if (cartProductIndex >= 0) {
//       //existing items
//       updatedCartItems[cartProductIndex].quantity =
//         this.cart.items[cartProductIndex].quantity + 1;
//     } else {
//       //new items
//       updatedCartItems.push({
//         productId: new ObjectId(product._id),
//         quantity: newQuantity
//       });
//     }

//     const updatedCart = {
//       items: updatedCartItems
//     };
//     const db = getDb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: updatedCart } }
//       );
//   }

//   getCart() {
//     const db = getDb();
//     const cartItemIds = this.cart.items.map(i => {
//       return i.productId;
//     });
//     //every product id
//     return db
//       .collection("products")
//       .find({ _id: { $in: cartItemIds } })
//       .toArray()
//       .then(products => {
//         //check deleted products
//         const productIds = products.map(p => {
//           return p._id;
//         });
//         console.log(productIds);
//         console.log(cartItemIds);
//         let deletedProducts = cartItemIds.filter(
//           cartItemId => !productIds.includes(cartItemId)
//         );
//         console.log("deletedProducts", deletedProducts);
//         return products.map(p => {
//           return {
//             ...p,
//             quantity: this.cart.items.find(i => {
//               return i.productId.toString() === p._id.toString();
//             }).quantity
//           };
//         });
//       });
//   }

//   deleteItemFromCart(productId) {
//     //filter the survived items
//     const updatedCartItems = this.cart.items.filter(item => {
//       return item.productId.toString() !== productId.toString();
//     });
//     const db = getDb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: { items: updatedCartItems } } }
//       );
//   }

//   addOrder() {
//     const db = getDb();
//     return this.getCart()
//       .then(products => {
//         const order = {
//           items: products,
//           user: {
//             _id: new ObjectId(this._id),
//             name: this.username
//           }
//         };
//         return db.collection("orders").insertOne(order);
//       })
//       .then(result => {
//         this.cart = { items: [] };
//         return db
//           .collection("users")
//           .updateOne(
//             { _id: new ObjectId(this._id) },
//             { $set: { cart: { items: [] } } }
//           );
//       });
//   }

//   getOrders() {
//     const db = getDb();
//     return db
//       .collection("orders")
//       .find({ "user._id": new ObjectId(this._id) })
//       .toArray();
//   }

//   static findById(userId) {
//     const db = getDb();
//     return db.collection("users").findOne({ _id: new ObjectId(userId) });
//   }
// }
// module.exports = User;
