const express = require("express");
const { check, body, query } = require("express-validator");

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
router.post(
  "/edit-product/",
  /**
   * @param value             Value to be validated (if present) | undefined
   * @param {Object} req      Express request object
   * @param {String} path     'address.country'
   * @param {String} location 'body' | 'param' | 'header' | 'query'
   *
   * @returns truthy if no error | ( throw new Error('') | falsy )
   */
  check("adhocEmail").custom((value, obj, ob3) => {
    // console.log(value);
    // return true;
    console.log(Object.keys(obj), ob3);
    const { req, path, location } = obj;
    console.log({
      value,
      href: req.url,
      body: req.body,
      params: req.params,
      others: { path, location },
    });
    throw new Error("custom issue");
  }),
  // .isLength({ min: 5 })
  // .withMessage("thoda bada email bhejo"),
  adminController.postEditProduct
);
// Note: alternatively we could have passed the id as a body, instead of using a dynamic param.
// Both ways are OK, depending upon style/conventions of the codebase.

// /admin/delete-product => POST
router.post("/product/delete/:productId", adminController.deleteProduct);

// /admin/add-product => POST
router.post("/delete-all-products", adminController.deleteAllProducts);

module.exports = router;
