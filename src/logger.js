module.exports = (req, res, next) => {
  // TODO let's imagine that this is an actual properly designed logger

  console.log('Request:', {
    path: req.url,
    body: req.body,
    query: req.query,
    time: Date.now(),
  });

  return next();
};
