const express = require("express");

const router = express.Router();

const adminController = require("../controllers/admin");

// /admin/add-product => GET
router.get("/add-product", adminController.getAddProduct);

// /admin/add-product => GET
router.get("/edit-product/:productId", adminController.getEditProduct);

// admin/products => GET list of products added by admin
router.get("/products", adminController.getAdminProducts);

// /admin/add-product => POST
router.post("/add-product", adminController.postAddProduct);

// /admin/edit-product => POST
router.post("/edit-product/:productId", adminController.postEditProduct);
// Note: alternatively we could have passed the id as a body, instead of using a dynamic param.
// Both ways are OK, depending upon style/conventions of the codebase.

// /admin/delete-product => POST
router.post("/product/delete/:productId", adminController.deleteProduct);

// /admin/add-product => POST
router.post("/delete-all-products", adminController.deleteAllProducts);

module.exports = router;
