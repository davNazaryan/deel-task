const Sequelize = require('sequelize');

const CONTRACT_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  TERMINATED: 'terminated',
};

const fields = {
  terms: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM(
      CONTRACT_STATUS.NEW,
      CONTRACT_STATUS.IN_PROGRESS,
      CONTRACT_STATUS.TERMINATED
    ),
  },
};

module.exports = {
  fields,
  CONTRACT_STATUS,
};
