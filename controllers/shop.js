const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(
  "sk_test_51HK0kEJybenQFofChFLmmUE29U5K55MnvN1N404mQfXQ1vfsQCcVJA7HrgwQ9Wqq2DSD27ZfgLi14aeJu6oJI3FH00hFP7qRkl"
);

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");

const ITEM_PER_PAGE = 1;

//'shop' page
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then((numOfProducts) => {
      totalItems = numOfProducts;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE) // skip the x * item per page. e.g. page (2 -1) * 2
        .limit(ITEM_PER_PAGE); // restrict the amount of data points you fetch
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE * page < totalItems, // item per page times page still less than totalItems
        hasPrevPage: page > 1, // page num greater than 1
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE), // 11 items, 2 per page, 11 / 2 = 5.5, ceil -> 6. return 6 as last page
      });
    })
    .catch((err) => {
      return next(err);
    });
};

//'product' page
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then((numOfProducts) => {
      totalItems = numOfProducts;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE) // skip the x * item per page. e.g. page (2 -1) * 2
        .limit(ITEM_PER_PAGE); // restrict the amount of data points you fetch
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE * page < totalItems, // item per page times page still less than totalItems
        hasPrevPage: page > 1, // page num greater than 1
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE), // 11 items, 2 per page, 11 / 2 = 5.5, ceil -> 6. return 6 as last page
      });
    })
    .catch((err) => {
      return next(err);
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
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId") //join products in user's cart
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: products,
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
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const { productId } = req.body;
  req.user
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
  Order.find({ "user.userId": req.user._id }) //logined user
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Your Orders",
        path: "/orders",
        orders: orders,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId") //join products in user's cart
    .execPopulate()
    .then((user) => {
      products = user.cart.items;
      total = products.reduce((t, p) => t + p.quantity * p.productId.price, 0);
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((p) => {
          return {
            name: p.productId.title,
            description: p.productId.dsscription,
            amount: p.productId.price * 100,
            currency: "usd",
            quantity: p.quantity,
          };
        }),
        success_url: `${req.protocol}://${req.get("host")}/checkout/success`, // => http://localhost:3000 // transcation complete stripe redirect
        cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
      });
    })
    .then((stripeSession) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        totalSum: total,
        sessionId: stripeSession.id,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      console.log(error);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//submit an order
exports.postOrder = (req, res, next) => {
  req.user
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
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
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
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};

//generate invoice
exports.getInvoice = (req, res, next) => {
  const { orderId } = req.params;
  //check user
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        throw next(new Error("No order found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorised"));
      }
      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join("data", "invoices", invoiceName);

      //create pdf doc
      const pdfDoc = new PDFDocument();
      //set response header
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`); //open the pdf file in the browser
      pdfDoc.pipe(fs.createWriteStream(invoicePath)); // to server
      pdfDoc.pipe(res); // to client

      pdfDoc.fontSize(26).text("Invoice", { underline: true });
      pdfDoc.text("-----------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.productData.price;
        pdfDoc.text(
          `${prod.productData.title} - ${prod.quantity} x \$${prod.productData.price} `
        );
      });
      pdfDoc.text("----");
      pdfDoc.text(`Total Price \$${totalPrice}`);
      pdfDoc.end();
      // fs.readFile(invoicePath, (err, bufferData) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader(
      //     "Content-Disposition",
      //     `inline; filename="${invoiceName}"`
      //   ); //open the pdf file in the browser
      //   res.send(bufferData);
      // });
      //streaming data for large data
      // const file = fs.createReadStream(invoicePath);
      // res.setHeader("Content-Type", "application/pdf");
      // res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`); //open the pdf file in the browser
      // file.pipe(res); //forward to browser to concat the incoming data piece
    })
    .catch((err) => next(err));
};
