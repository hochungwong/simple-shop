const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

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
      console.log("shop controller|getCart|user", user);
      const products = user.cart.items;
      console.log("shop controller|getCart|proudcts", products);
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
