const { Product } = require("../models/Product");
const {
  User,
  addProductToCart,
  decrementProductFromCart,
  deleteItemFromCart,
  getCartWithCompleteProducts,
  getCartTotal,
} = require("../models/User");
const { getDb } = require("../util/database");
const ObjectId = require("mongoose").Types.ObjectId;
// const CartItem = require("../models/CartItem");
// const Order = require("../models/Order");
// const OrderItem = require("../models/CartItem");
const { extractKeys, dateToTimeStampString } = require("../util/common");
const { Order } = require("../models/Order");
const Cart = require("../models/Cart");

const indexPage = async (req, res, next) => {
  return res.redirect('/products'); // fix shop being empty. Remove if when shop page is added.
  res.render("shop/index", {
    docTitle: "My shop",
    myActivePath: "shop-page",
  });
};

const getProducts = async (req, res, next) => {
  const { page, pageSize, offset } = res.locals.paginationParams;
  const { skip, limit } = res.locals.dbPaginationParams;

  const productsCount = await Product.count();
  const products = await Product.find().skip(skip).limit(limit).lean();

  res.render("shop/product-list", {
    prods: products,
    docTitle: "Products",
    myActivePath: "/products",
    page,
    pageSize,
    offset,
    total: productsCount,
  });
};

const getProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.productId); // string _id works, but only when passed in an object

  if (!product) {
    next(); // for not found route
    return; // end current middleware
  }

  res.render("shop/product-detail", {
    prod: product,
    docTitle: `${product.title} - ${product._id || product.id}`,
    myActivePath: "/products",
  });
};

const cartPage = async (req, res, next) => {
  const user = req.user;
  const cartItems = user.cart.items; // have to 'get' it since it's an association, not owned column

  // map doesn't work with async functions, since the function evaluates to a promise
  // use Promise.all, no choice
  const cartItemsWithQuantity = await Promise.all(
    cartItems.map(async (cartItem) => {
      const fullProduct = await Product.findById(cartItem.productId);
      const objectForCartView = extractKeys(
        { ...fullProduct, ...cartItem },
        // keys of the cartItem
        ["_id", "title", "imageUrl", "description", "price", "quantity"],
        {
          shortKeys: true,
          removeAssociatedColumns: false,
        }
      );

      return objectForCartView;
    })
  );

  const totalPrice = cartItemsWithQuantity?.reduce((accum, prod) => {
    const quantity = prod["quantity"] ?? 0;
    const price = prod.price;

    return accum + quantity * price;
  }, 0);

  res.render("shop/cart", {
    docTitle: "Cart",
    myActivePath: "/cart",
    totalPrice,
    products: cartItemsWithQuantity ?? [],
  });
};

const cartPageUsingIncludesOperator = async (req, res, next) => {
  const user = req.user;

  const cartWithCompleteProducts = await getCartWithCompleteProducts(user);

  const cartItemsWithQuantity = cartWithCompleteProducts.items.map(
    (cartItem) => {
      const objectForCartView = extractKeys(
        cartItem,
        // keys of the cartItem
        ["_id", "title", "imageUrl", "description", "price", "quantity"],
        {
          shortKeys: true,
          removeAssociatedColumns: false,
        }
      );

      return objectForCartView;
    }
  );

  // #3 total to show
  const totalPrice = await getCartTotal(user);

  res.render("shop/cart", {
    docTitle: "Cart",
    myActivePath: "/cart",
    totalPrice,
    products: cartItemsWithQuantity ?? [],
  });
};

const ordersPage = async (req, res, next) => {
  const user = req.user;
  // let orders = await user.getOrders(); // used with MONGODB

  let orders = await Order.find({ userId: user._id }).lean();

  orders = orders.map((order) => {
    const beautifiedOrder = extractKeys(
      order,
      ["_id", "totalAmount", "shippingAddress", "createdAt"],
      {
        removeAssociatedColumns: true,
      }
    );
    beautifiedOrder.createdAt = dateToTimeStampString(
      beautifiedOrder.createdAt
    );
    return beautifiedOrder;
  });

  res.render("shop/order-list", {
    docTitle: "Orders",
    myActivePath: "/orders",
    orders,
  });
};

const orderPage = async (req, res, next) => {
  const user = req.user;
  const orderId = req.params.orderId;

  const order = await Order.findById(orderId).lean();
  const products = order.items.map((prod) => {
    return extractKeys(
      prod,
      ["_id", "title", "price", "imageUrl", "quantity", "description"],
      {
        shortKeys: true,
        removeAssociatedColumns: false,
      }
    );
  });
  // MONGODB - start (not used now)
  // const order = await user.getOrder(orderId);

  // if (!order) return next(); // no orders exist, 404

  // let products = order.items;

  // products = products.map((prod) => {
  //   return extractKeys(
  //     prod,
  //     ["_id", "title", "price", "imageUrl", "quantity", "description"],
  //     {
  //       shortKeys: true,
  //       removeAssociatedColumns: false,
  //     }
  //   );
  // });
  // MONGODB - end

  res.render("shop/order", {
    docTitle: `Order id ${order.id || order._id}`,
    id: orderId,
    myActivePath: "",
    totalAmount: order.totalAmount,
    products: products,
  });
};

const checkoutPage = async (req, res, next) => {
  res.render("shop/checkout", {
    docTitle: "Checkout",
    myActivePath: "/checkout",
  });
};

const postCart = async (req, res, next) => {
  const user = req.user;
  const prodId = req.body.productId;
  const quantityDelta = req.body.quantity ?? 1;

  // refactored logic from here into models
  // "fat models, skinny controllers"
  if (req.query.add) {
    await addProductToCart(user, prodId, quantityDelta);
  } else if (req.query.decrement) {
    await decrementProductFromCart(user, prodId, quantityDelta);
  } else if (req.query.delete) {
    await deleteItemFromCart(user, prodId);
  }

  res.redirect("/cart");
  return;
};

const createOrder = async (req, res, next) => {
  const user = req.user;
  const currentShippingAddress = req.body.shippingAddress;
  // await user.createOrder(currentShippingAddress);

  const cart = await getCartWithCompleteProducts(user);
  const totalPrice = await getCartTotal(user);

  await Order.create({
    userId: user._id,
    items: cart.items.map((item) => {
      return {
        price: item.price,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        userId: item.userId,
        quantity: item.quantity,
      };
    }),
    totalAmount: totalPrice,
    shippingAddress: currentShippingAddress ?? "",
  });

  // clear the cart items
  const cartId = user.cartId._id;
  await Cart.findByIdAndUpdate(cartId, {
    $pull: { items: {} },
  });

  res.redirect("/orders");
};

const checkoutEditPage = async (req, res, next) => {
  res.redirect("/");
};

module.exports = {
  indexPage,
  getProducts,
  cartPage,
  cartPageUsingIncludesOperator,
  checkoutPage,
  getProduct,
  postCart,
  checkoutEditPage,
  ordersPage,
  createOrder,
  orderPage,
};
