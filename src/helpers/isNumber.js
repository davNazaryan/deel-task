/** --------------------------------------------------
 * Having a validator as a helper function si a bad design.
 * But due of time restrictions, here we are ;)
 * In the real project I'll probably use something like 'yup'.
 * -------------------------------------------------- */

const isNonNegativeNumber = (toValidate) => {
  const num = Math.floor(Number(toValidate));

  return num !== Infinity && String(num) === toValidate && num >= 0;
};

module.exports = {
  isNonNegativeNumber,
};
