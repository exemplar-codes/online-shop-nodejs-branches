const { validationResult } = require("express-validator");
const { Product } = require("../models/Product");
const mongoose = require("mongoose");
const { renderErrorPage } = require("./error");

const getAdminProducts = async (req, res, next) => {
  // Sequelize code, NOT USED NOW, left for observation
  // const admin = req.user;
  // const products = await admin.getProducts();

  // Note: for now, everyone is an admin and can edit everything, we'll re-add associated user later
  // const admin = req.user;
  // const products = await admin.fetchAllAssociatedProducts();
  const admin = req.user;
  const products = await Product.find({ userId: admin._id });

  res.render("admin/products", {
    prods: products,
    docTitle: "Admin products",
    myActivePath: "/admin/products",
  });
};

const getAddProduct = (req, res, next) => {
  res.render("admin/add-or-edit-product", {
    myActivePath: "on-admin-page",
    docTitle: "Add product",
    editing: false,
  });
};

const getEditProduct = async (req, res, next) => {
  // Sequelize code, NOT USED NOW, left for observation
  // const admin = req.user;
  // const [product = null] = await admin.getProducts({ where: { id: prodId } });

  // Note: for now, everyone is an admin and can edit everything, we'll re-add associated user later
  // const admin = req.user;
  // const prodId = req.params.productId;
  // const product = await admin.fetchAssociatedProductById(prodId);

  const prodId = req.params.productId;
  const product = await Product.findById(prodId);

  if (!product) {
    // end middleware, hopefully 404 will run ahead
    next();
    return;
  }

  res.render("admin/add-or-edit-product", {
    myActivePath: "/admin/edit-product",
    docTitle: "Edit product",
    prod: product,
    editing: true,
  });
};

const postAddProduct = async (req, res, next) => {
  // Sequelize code, NOT USED NOW, left for observation
  // const user = req.user;
  // await user.createProduct({
  //   title: req.body.title,
  //   imageUrl: req.body.imageUrl,
  //   description: req.body.description,
  //   price: req.body.price,
  // });

  const errors = validationResult(req);

  console.log(req.body);
  console.log({ errors });
  return res.redirect("/");

  const product = new Product({
    title: req.body.title,
    imageUrl: req.body.imageUrl,
    description: req.body.description,
    price: req.body.price,
    userId: req.user._id,
  });

  product.save();

  res.redirect("/");
};

const postEditProduct = async (req, res, next) => {
  const admin = req.user;
  const prodId = req.params.productId;

  if ("adhocEmail" in req.body) {
    const errors = validationResult(req);
    const errorsArray = errors.array();
    const errorsMap = errors.mapped();
    console.log({
      body: req.body,
      errorsArray,
      errorsMap,
    });
    // return next();
    return renderErrorPage(res, 500, {
      errorMessage: JSON.stringify(errorsMap, null, 2).trim(),
      // errorsMap?.adhocEmail?.msg ?? "xyz",
    });
  }

  // Sequelize code, NOT USED NOW, left for observation
  // const admin = req.user;
  // const [product = null] = await admin.getProducts({ where: { id: prodId } });

  // // to check if product exists and the user is it's creator
  // let product = await admin.fetchAssociatedProductById(prodId);

  // Note: for now, everyone is an admin and can edit everything, we'll re-add associated user later
  // const product = await Product.findById(prodId);
  const product = await Product.findByIdAndUpdate(
    new mongoose.mongo.ObjectId(prodId),
    {
      title: req.body.title,
      imageUrl: req.body.imageUrl,
      description: req.body.description,
      price: req.body.price,
    }
  );

  if (!product) {
    // end middleware, hopefully 404 will run ahead
    next();
    return;
  }

  // product.title = req.body.title;
  // product.imageUrl = req.body.imageUrl;
  // product.description = req.body.description;
  // product.price = req.body.price;

  // await product.save();

  res.redirect("/");
};

const deleteProduct = async (req, res, next) => {
  const admin = req.user;
  const prodId = req.params.productId;
  // Sequelize code, NOT USED NOW, left for observation
  // const admin = req.user;

  // const productOwnedByAdmin = await admin.hasProduct(prodId);

  // if (productOwnedByAdmin) {
  //   await admin.removeProduct(prodId); // dissociate
  //   await Product.destroy({ where: { id: prodId } }); // destroy

  //   // FIXME: how know if operation succeeeded or not in Sequelize
  // }

  // if (productOwnedByAdmin) res.redirect("/");

  // // to check if product exists and the user is it's creator
  // const product = await admin.fetchAssociatedProductById(prodId);

  // Note: for now, everyone is an admin and can edit everything, we'll re-add associated user later
  const product = await Product.findByIdAndDelete(prodId);

  if (!product) {
    // 404 page
    next();
    return;
  }

  res.redirect("/");
  return;
};

const deleteAllProducts = async (req, res, next) => {
  const admin = req.user;
  // await admin.deleteAllAssociatedProducts();

  // Note: for now, everyone is an admin and can edit everything, we'll re-add associated user later
  await Product.deleteMany();
  res.redirect("/");
};

module.exports = {
  getAdminProducts,
  getAddProduct,
  postAddProduct,
  deleteAllProducts,
  getEditProduct,
  postEditProduct,
  deleteProduct,
};
