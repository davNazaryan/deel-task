const Sequelize = require('sequelize');

const fields = {
  description: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  price: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
  },
  paid: {
    type: Sequelize.BOOLEAN,
    default: false,
  },
  paymentDate: {
    type: Sequelize.DATE,
  },
};

module.exports = { fields };
