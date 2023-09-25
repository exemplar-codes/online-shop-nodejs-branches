const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const SERVER_FLAGS = {
  autoLoadBrowser: false,
  showAuthLog: false,
  showCookiesLog: false,
  isAuthenticated: true,
  adhocEmail: false, // in edit product page
  dontValidateForms: false,

  exampleFilePicker: false,
  showMulterLogs: false,

  printPaginationParams: false,
  sendPaginationParams: false,

  showRawDataControls: !!process.env.DEVELOPMENT_MODE,
};

const {
  mongooseConnect,
  getDb,
  prepopulateIrrelevantSampleData,
  deleteAllCollections,
  // mongoConnect,
} = require("./util/database.js");

const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");

const app = express();

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const errorController = require("./controllers/error");
const { User, prepopulateUsers } = require("./models/User");
const { Product, prepopulateProducts } = require("./models/Product");
const authRouter = require("./routes/auth.js");
const { createWriteStream } = require("fs");
const {
  paginationMidddleware,
  paginationLoggers,
} = require("./util/middlewares/pagination.js");

if (SERVER_FLAGS.autoLoadBrowser) {
  const autoReloadBrowser = require("./util/auto-reload-browser.js");
  app.use(autoReloadBrowser());
}

// app.set('view engine', 'pug');
// app.set('views', 'views'); // not needed for this case, actually
app.set("view engine", "ejs");
app.set("views", "views"); // not needed for this case, actually

app.use(bodyParser.urlencoded({ extended: false }));

const multerConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "multer-uploads");
    console.log("Destination called", file.originalname);
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
    console.log("fileName called", file.originalname);
  },
});

const multerFileFilter =
  /**
   * @returns cb(null, isAccepted)
   */
  (req, file, cb) => {
    if (file.mimetype.includes("pdf")) {
      // reject PDF
      console.log("File rejected");
      return cb(null, false);
    }

    console.log("File accepted");
    cb(null, true);
  };
app.use(
  multer({ storage: multerConfig, fileFilter: multerFileFilter }).single(
    "myFile"
  )
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "multer-uploads")));
app.use(cors());
app.use(require("cookie-parser")());

// // add multer-uploads getter - not needed now
// app.get("/multer-uploads/:requestedFileName", (req, res, next) => {
//   res.sendFile(
//     path.join(__dirname, "multer-uploads", req.params.requestedFileName)
//   );
// });

// learning flipper flags - to hide logs if they become too much
app.use((req, res, next) => {
  res.locals = {
    ...res.locals,
    ...SERVER_FLAGS,
  };

  next();
});

// usual req logger middleware
app.use((req, res, next) => {
  if (SERVER_FLAGS.showMulterLogs) {
    console.log("req logger middleware");
    console.log("Multer body", { body: req.body });
    console.log("Multer file/files", { file: req.file, files: req.files });
  }
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

  if (SERVER_FLAGS.showCookiesLog) {
    console.log(req.cookies, req.headers.cookie);
  }

  // req.user = await User.findById(1);
  const [firstUser = null] = await User.find(); // as of now, this is the sample user
  req.user = firstUser;

  if (SERVER_FLAGS.showAuthLog)
    console.log("Mock authentication success", {
      email: firstUser?.email,
      id: firstUser?._id,
    });

  if (!SERVER_FLAGS.isAuthenticated) {
    next(new Error("Not authorized"));
  }
  next(null);
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

let count = 1;
app.use("/get-pdf", async (req, res, next) => {
  const pdfDoc = new PDFDocument();
  const fileName_ = count + ".pdf";
  count++;
  const filePath = path.join(__dirname, fileName_);
  const t = createWriteStream(filePath);
  pdfDoc.pipe(t);
  pdfDoc.pipe(res);

  pdfDoc
    .fontSize(20)
    .fillColor("red")
    .text("First line of textp" + fileName_, { underline: true })
    .fillColor("black");
  pdfDoc.text("Second line of text");

  res.on("close", (err) => {
    fs.unlink(fileName_, (err) => {
      if (err) next(err);
    });
  });

  pdfDoc.end();
});

app.use(errorController.get404);

// error sink
app.use((err, req, res, next) => {
  console.log("Reached the error sink (terminal)");
  const content = `<p>You reached the error sink</p>
  <p>Time: ${new Date().toLocaleTimeString()}</p>
  <hr />
  <p>Error message<pre><code>${JSON.stringify(
    err.message,
    null,
    2
  )}</code></pre></p>
  <hr />
  <p>Error - Stringified JSON<pre><code>${JSON.stringify(
    err,
    null,
    2
  )}</code></pre></p>`;

  return errorController.renderErrorPage(res, res.statusCode, {
    errorMessage: content,
    verbose: true,
  });

  res.send(content);
});

// mongodb and server intialization
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
