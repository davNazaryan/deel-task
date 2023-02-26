const { Op } = require('sequelize');

const { isNonNegativeNumber } = require('./isNumber');

module.exports = (start, end) => {
  // date range validation
  if ((start && !isNonNegativeNumber(start)) || (end && !isNonNegativeNumber(end))) {
    return { success: false };
  }

  const filterDate = {};
  if (start || end) {
    if (start && end) {
      filterDate.paymentDate = {
        [Op.between]: [new Date(parseInt(start, 10)), new Date(parseInt(end, 10))],
      };
    } else if (start) {
      filterDate.paymentDate = { [Op.gte]: new Date(parseInt(start, 10)) };
    } else if (end) {
      filterDate.paymentDate = { [Op.lte]: new Date(parseInt(end, 10)) };
    }
  }

  return { success: true, filterDate };
};
