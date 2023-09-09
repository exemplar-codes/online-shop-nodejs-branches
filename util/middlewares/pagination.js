/**
 * Reads page, pageSize, offset and other stuff from incoming request query param
 * Does santiy logic to make pagination coherent
 */

// sort => [{ key, order }] => [{sort_by, sort_order}], for redundants, take latest.
// filter => [{key, value, negative}] | [{key, values, negatives}]

// filter_by, filter_value, filter_negative = [=false]

// group by filter_by, then accumulate values and their corresponding negatives

function paginationMidddleware(req, res, next = () => {}) {
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

module.exports = { paginationMidddleware, paginationLoggers };
