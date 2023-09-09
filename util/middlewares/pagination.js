/**
 * Reads page, pageSize, offset and other stuff from incoming request query param
 * Does santiy logic to make pagination coherent
 */

// sort => [{ key, order }] => [{sort_by, sort_order}], for redundants, take latest.
// filter => [{key, value, negative}] | [{key, values, negatives}]

// filter_by, filter_value, filter_negative = [=false]

// group by filter_by, then accumulate values and their corresponding negatives

// worry only about page, page_size and offset. Set default if input undefined or invalid
function paginationMidddleware(req, res, next = () => {}) {
  // 1. check and set undefined
  const page = req.query.page ?? 1;
  const page_size = req.query.page_size ?? 5;
  const offset = req.query.offset ?? 0;

  // 2. Find invalid values and fix them
  // const paginationParams = {
  //   page: req.query.page ?? 1,
  //   page_size: req.query.page_size ?? 20,
  //   offset: req.query.offset ?? 0,
  // };

  const paginationParams = {
    page,
    page_size,
    offset,
  };

  res.locals.paginationParams = paginationParams;
  next();
  return paginationParams;
}

// assume array of Infinite size
// arr
//   .splice(0, offset)
//   .chunkInto(Math.max(1, Math.min(20, page_size)))
//   .at(Math.max(1, page - 1));

function paginationMidddleware__experimental(req, res, next = () => {}) {
  const PAGINATION_KEYS = {
    PAGE: "page",
    PAGE_SIZE: "page_size",
    OFFSET: "offset",

    // SORT_BY: "sort_by",
    // SORT_ORDER: "sort_order",

    // FILTER_BY: "filter_by",
    // FILTER_VALUE: "filter_value",
    // FILTER_NEGATIVE: "filter_negative",
    // everything else is either a filter, or ignored
  };

  const PAGINATION_DEFAULTS = {
    [PAGINATION_KEYS.PAGE]: 1,
    [PAGINATION_KEYS.PAGE_SIZE]: 20,
    [PAGINATION_KEYS.OFFSET]: 0,

    // [PAGINATION_KEYS.SORT_BY]: [], // sort by 'name'
    // [PAGINATION_KEYS.SORT_ORDER]: [], // 'asc' | 'desc'

    // [PAGINATION_KEYS.FILTER_BY]: [], // filter by 'genre'
    // [PAGINATION_KEYS.FILTER_VALUE]: [], // show items with 'genre' 'RPG'
    // [PAGINATION_KEYS.FILTER_NEGATIVE]: [], // _dont show?_ show items with 'genre' 'RPG'
  };

  const paginationParams = Object.values(PAGINATION_KEYS).reduce(
    (accum, keyValue) => {
      accum[keyValue] = req.query[keyValue] || PAGINATION_DEFAULTS[keyValue];
      return accum;
    },
    {}
  );

  res.locals.paginationParams = paginationParams;

  next();

  return paginationParams;
}

function paginationLoggers(req, res, next = () => {}) {
  if (!res.locals.printPaginationParams && !res.locals.sendPaginationParams)
    return next();

  const paginationParams = paginationMidddleware(req, res);

  if (res.locals.printPaginationParams) {
    console.log(req.url, { paginationParams });
  }

  if (res.locals.sendPaginationParams) {
    res.json(res.locals.paginationParams);
    return;
  }

  next();
}

module.exports = {
  paginationMidddleware,
  paginationLoggers,
  paginationMidddleware__experimental,
};
