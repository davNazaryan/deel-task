const Sequelize = require('sequelize');

const PROFILE_TYPE = {
  CLIENT: 'client',
  CONTRACTOR: 'contractor',
  ADMIN: 'admin',
};

const fields = {
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  profession: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  balance: {
    type: Sequelize.DECIMAL(12, 2),
  },
  type: {
    type: Sequelize.ENUM(
      PROFILE_TYPE.CLIENT,
      PROFILE_TYPE.CONTRACTOR,
      PROFILE_TYPE.ADMIN
    ),
  },
};

module.exports = {
  fields,
  PROFILE_TYPE,
};
