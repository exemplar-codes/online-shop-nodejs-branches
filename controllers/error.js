const get404 = (req, res, next) => {
  res
    .status(404)
    .render("404", { myActivePath: "404-page", docTitle: "Page Not Found" });
  next();
};

/**
 * @param {Express.Response} res
 *
 * @param {String=} errorCode
 * @param {String=} errorMessage
 * @param {String=} docTitle
 * @param {String=} myActivePath
 * @param {Bool=} verbose
 */
const renderErrorPage = (res, errorCode = 500, props = {}) => {
  const {
    errorMessage = "My server error",
    myActivePath = "",
    docTitle = "Error page",
    verbose = false,
  } = props;

  res.status(errorCode).render("500", {
    myActivePath: "",
    docTitle,
    props: {
      verbose,
      errorCode,
      errorMessage,
    },
  });
};

module.exports = {
  get404,
  renderErrorPage,
};
