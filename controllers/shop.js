const Product = require("../models/product");
const Order = require("../models/order");

//'shop' page
exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

//'product' page
exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      console.log("shop controller|getProducts", products);
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const { productId } = req.params;
  Product.findById(productId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.session.user
    .populate("cart.items.productId") //join products in user's cart
    .execPopulate()
    .then((user) => {
      console.log("shop controller|getCart|user", user);
      const products = user.cart.items;
      console.log("shop controller|getCart|proudcts", products);
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: products,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postCart = (req, res, next) => {
  const { productId } = req.body;
  Product.findById(productId)
    .then((product) => {
      return req.session.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const { productId } = req.body;
  req.session.user
    .removeFromCart(productId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

//fetch all the orders
exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.session.user._id }) //logined user
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Your Orders",
        path: "/orders",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

//submit an order
exports.postOrder = (req, res, next) => {
  req.sessionuser
    .populate("cart.items.productId") //join product in user's cart
    .execPopulate()
    .then((user) => {
      //return products: [{}, {}, ...]
      const products = user.cart.items.map((i) => {
        console.log(i.productId._doc);
        return {
          quantity: i.quantity,
          productData: { ...i.productId._doc }, //include all the order data
        };
      });
      const order = new Order({
        user: {
          name: req.session.user.name,
          userId: req.session.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.session.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};
