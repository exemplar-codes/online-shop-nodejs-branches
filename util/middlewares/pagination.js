/**
 * Reads page, pageSize, offset and other stuff from incoming request query param
 * Does santiy logic to make pagination coherent
 */

// sort => [{ key, order }] => [{sort_by, sort_order}], for redundants, take latest.
// filter => [{key, value, negative}] | [{key, values, negatives}]

// filter_by, filter_value, filter_negative = [=false]

// group by filter_by, then accumulate values and their corresponding negatives

// worry only about page, pageSize and offset. Set default if input undefined or invalid
function paginationMidddleware(req, res, next = () => {}) {
  // 1. check and set undefined
  let page = parseInt(req.query.page ?? 1);
  page = Math.max(1, page);

  let pageSize = parseInt(req.query.pageSize ?? 5);
  pageSize = Math.max(1, pageSize);

  let offset = parseInt(req.query.offset ?? 0);
  offset = Math.max(0, offset);

  // 2. Find invalid values and fix them
  // const paginationParams = {
  //   page: req.query.page ?? 1,
  //   pageSize: req.query.pageSize ?? 20,
  //   offset: req.query.offset ?? 0,
  // };

  const paginationParams = {
    page,
    pageSize,
    offset,
  };

  // 3. DB pagination params equivalent
  // do virtual calculation from page, pageSize and offset
  // calculate limit and skip
  // limit = pageSize ok!
  // skip = (offset) + 0 (if page=1)
  // skip = (offset) + pageSize * (page - 1)  (if page=2)
  // skip = offset + pageSize * (page - 1) ok!
  const limit = pageSize;
  const skip = offset + pageSize * (page - 1);
  const dbPaginationParams = { limit, skip };

  res.locals.paginationParams = paginationParams;
  res.locals.dbPaginationParams = dbPaginationParams;

  next();
  return { paginationParams, dbPaginationParams };
}

// assume array of Infinite size
// arr
//   .splice(0, offset)
//   .chunkInto(Math.max(1, Math.min(20, pageSize)))
//   .at(Math.max(1, page - 1));

function paginationMidddleware__experimental(req, res, next = () => {}) {
  const PAGINATION_KEYS = {
    PAGE: "page",
    PAGE_SIZE: "pageSize",
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

  const allPaginationStuff = paginationMidddleware(req, res);

  if (res.locals.printPaginationParams) {
    console.log(req.url, allPaginationStuff);
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
