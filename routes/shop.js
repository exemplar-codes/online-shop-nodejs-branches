const express = require("express");
const {
  paginationLoggers,
  paginationMidddleware,
} = require("../util/middlewares/pagination");

const router = express.Router();

const shopController = require("../controllers/shop");

router.get("/", shopController.indexPage);
router.get(
  "/products",
  paginationMidddleware,
  paginationLoggers,
  shopController.getProducts
);
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
const fs = require("node:fs");
router.get("/invoices/:orderId", (req, res, next) => {
  const assetBelongsToUser = true;
  // const assetBelongsToUser = false; // mock that auth failed (not allowes)

  // goes to error sink
  if (!assetBelongsToUser)
    throw new Error("mock worked, not authorized to see invoice");
  else {
    res.setHeader("content-type", "application/pdf"); // set type
    res.setHeader(
      "content-disposition",
      `inline; filename=invoice-${req.params.orderId}.pdf`
    ); // (inline | attachment); filename="nameOfFile.myExtension"
    // res.sendFile(path.join(projectPath, "invoices", req.params.orderId));
    const fileStream = fs.createReadStream(
      path.join(projectPath, "invoices", req.params.orderId)
    );

    res.statusCode = 200;

    fileStream.pipe(res);
  }

  // next();
});

module.exports = router;
