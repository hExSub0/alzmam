const asyncHandler = (handler) => (req, res, next) => {
  const handlerPromise = Promise.resolve(handler(req, res, next));
  return handlerPromise.catch(next);
};

module.exports = asyncHandler;
