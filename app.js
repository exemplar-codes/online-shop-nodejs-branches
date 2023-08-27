const path = require("path");

const {
  mongooseConnect,
  getDb,
  prepopulateIrrelevantSampleData,
  deleteAllCollections,
  // mongoConnect,
} = require("./util/database.js");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const errorController = require("./controllers/error");
const { User, prepopulateUsers } = require("./models/User");
const { Product, prepopulateProducts } = require("./models/Product");
const authRouter = require("./routes/auth.js");

// app.set('view engine', 'pug');
// app.set('views', 'views'); // not needed for this case, actually
app.set("view engine", "ejs");
app.set("views", "views"); // not needed for this case, actually

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(require("cookie-parser")());

// learning flipper flags - to hide logs if they become too much
app.use((req, res, next) => {
  res.locals = {
    ...res.locals,
    showAuthLog: false,
    showCookiesLog: false,
    isAuthenticated: true,
    adhocEmail: false, // in edit product page
    dontValidateForms: true,
    exampleFilePicker: false,
  };

  next();
});

// usual req logger middleware
app.use((req, res, next) => {
  console.log({ body: req.body });
  next();
});

// mock authentication, i.e. get user who's making the request
app.use(async (req, res, next) => {
  // trying out the cookie parser
  // res.cookie("isLoggedInAug9", 23);
  res.setHeader("set-cookie", "isLoggedInAug9=; max-age=0;");
  res.cookie("abce1", "def");
  // res.setHeader("set-cookie", "abc=; max-age=0;");
  res.clearCookie("abce");

  if (res.locals.showCookiesLog) {
    console.log(req.cookies, req.headers.cookie);
  }

  // req.user = await User.findById(1);
  const [firstUser = null] = await User.find(); // as of now, this is the sample user
  req.user = firstUser;

  if (res.locals.showAuthLog)
    console.log("Mock authentication success", {
      email: firstUser?.email,
      id: firstUser?._id,
    });
  next();
});

app.get("/try", async (req, res, next) => {
  await new Promise((r) => setTimeout(r, 1000));
  return res.json({ password: "love", time: new Date().toLocaleTimeString() });
});

app.use(authRouter);
app.use("/admin", adminRoutes);
app.use(shopRoutes);

// EXPLICIT CONTROL ROUTES, FOR DEBGUGGING
app.post("/delete-all-data", async (req, res, next) => {
  await deleteAllCollections();
  res.redirect("/");
});

app.post("/reset-all-data", async (req, res, next) => {
  await deleteAllCollections();
  await prepopulateIrrelevantSampleData();
  const firstSampleUser = await prepopulateUsers();
  await prepopulateProducts(firstSampleUser);
  res.redirect("/");
});

app.use(errorController.get404);

// error sink
app.use((err, req, res, next) => {
  console.log("Something went wrong");
  res.send(
    `<p>You reached the error sink</p>
    <p>Time: ${new Date().toLocaleTimeString()}</p>
    <hr />
    <p><pre><code>${err}</code></pre></p>`
  );
});

// express code

// // start express from inside the mongoConnect callback
// mongoConnect(async (client) => {
//   await prepopulateIrrelevantSampleData();
//   const firstSampleUser = await User.prepopulateUsers();
//   await Product.prepopulateProducts(firstSampleUser);
//   console.log("Pre-scripts finished execution");
//   console.log("------------------------------");

//   app.listen(3000);
// });

let ranOnceAlready = false;
mongooseConnect(async (mongooseObject) => {
  await prepopulateIrrelevantSampleData();
  const firstSampleUser = await prepopulateUsers();
  await prepopulateProducts(firstSampleUser);

  let dropEverything = false;
  // dropEverything = true; // uncomment and comment to wipe database
  if (dropEverything) deleteAllCollections();

  let runOnce = false;
  // runOnce = true; // for running custom startup code - uncomment and comment to run
  if (runOnce && !ranOnceAlready) {
    // run custom startup code here

    ranOnceAlready = true;
    console.log("runOnce ran!");
  }

  console.log("Pre-scripts finished execution");
  console.log("------------------------------");

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, async () => {
    console.log(`Running on port ${PORT}`);
    return;
    const fetch = require("node-fetch");

    const uri = "admin/edit-product";
    const params = {};
    const body = {
      adhocEmail: 2,
      password: "hellox",
      confirmPassword: "hello",
    };

    await fetch(
      `http://localhost:${PORT}/${uri}?${
        new URLSearchParams(params)?.toString() ?? "\b"
      }`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    // run mock code here
  });
});
