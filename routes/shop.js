const express = require("express");

const router = express.Router();

const shopController = require("../controllers/shop");

router.get("/", shopController.indexPage);
router.get("/products", shopController.getProducts);
router.get("/products/:productId", shopController.getProduct);
router.get("/cart", shopController.cartPageUsingIncludesOperator); // router.get("/cart", shopController.cartPage);
// router.get("/checkout", shopController.checkoutPage);
router.get("/orders", shopController.ordersPage);
router.get("/orders/:orderId", shopController.orderPage);

router.post("/cart", shopController.postCart);
router.post("/orders", shopController.createOrder);
// router.put("/checkout", shopController.checkoutEditPage);

// asset protection, make a conditional middleware that throws error if unauthorized
const projectPath = require("../util/path");
const path = require("node:path");
router.use("/invoices/:orderId", (req, res, next) => {
  const assetBelongsToUser = true;
  // const assetBelongsToUser = false; // mock that auth failed (not allowes)

  // goes to error sink
  if (!assetBelongsToUser)
    throw new Error("mock worked, not authorized to see invoice");
  else res.download(path.join(projectPath, "invoices", req.params.orderId));

  // next();
});

module.exports = router;
