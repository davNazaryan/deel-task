module.exports = (err, req, res, next) => {
  // TODO let's imagine that this is an actual properly designed error handler
  console.error(err.stack);

  res.status(500).send('Something broken!');
};
