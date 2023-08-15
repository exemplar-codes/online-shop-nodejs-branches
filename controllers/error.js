const get404 = (req, res, next) => {
  res
    .status(404)
    .render("404", { myActivePath: "404-page", docTitle: "Page Not Found" });
  next();
};

/**
 * @param {Express.Response} req
 *
 * @param {String=} errorCode
 * @param {String=} errorMessage
 * @param {String=} docTitle
 * @param {String=} myActivePath
 */
const renderErrorPage = (res, errorCode = 500, props) => {
  const {
    errorMessage = "My server error",
    myActivePath = "",
    docTitle = "Error page",
  } = props;

  res.status(errorCode).render("500", {
    myActivePath: "",
    docTitle,
    props: {
      errorCode,
      errorMessage,
    },
  });
};

module.exports = {
  get404,
  renderErrorPage,
};
