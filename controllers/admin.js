const mongoose = require("mongoose");
const mongoDb = require("mongodb");
const fileHelper = require("../util/file");
const Product = require("../models/product");

const { validationResult } = require("express-validator");

exports.getAddProduct = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    // product: {
    //   title: "",
    //   imageUrl: "",
    //   price: "",
    //   description: "",
    // },
    validationErrors: [],
  });
};

//create product
exports.postAddProduct = (req, res, next) => {
  const { title, description, price } = req.body;
  const image = req.file;
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        //return user input
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file is not an image",
      validationErrors: [],
    });
  }
  const imageUrl = image.path;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //422 invalid input
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        //return user input
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.user, //mongoose extra userId automatically
  });
  product
    .save()
    .then((result) => {
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); //skip all the middleware, go direct to 500 page
    });
};

//edit action
exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit; // /:productId?edit=true
  if (!editMode) {
    return res.redirect("/");
  }
  const { productId } = req.params;
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//update product action
exports.postEditProduct = (req, res, next) => {
  //fetch product info
  //input "name"
  const { productId } = req.body;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDescription = req.body.description;
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        //return user input
        _id: productId,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  Product.findById(productId)
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if (image) {
        fileHelper.deleteFile(product.iamgeUrl);
        product.imageUrl = image.path;
      }
      return product.save();
    })
    .then((result) => {
      console.log("updated product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
    });
};

//fetch all products
exports.getProducts = (req, res, next) => {
  Product.find()
    //.select("title price imageUrl -_id") // selected field to fetch
    //.populate("userId", "name") //concat field
    .then((products) => {
      console.log("admin controller|getProducts", products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteProduct = (req, res, next) => {
  const { productId } = req.params;
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found"));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({
        _id: productId,
        userId: req.user._id,
      });
    })
    .then(() => {
      console.log("deleted product");
      res.status(200).json({ message: "Succees!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Deleting product failed." });
    });
};
