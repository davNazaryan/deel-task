const Sequelize = require('sequelize');

const { fields: profileFields } = require('./profile');
const { fields: contractFields } = require('./contract');
const { fields: jobFields } = require('./job');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite3',
});

class Profile extends Sequelize.Model {}
Profile.init(profileFields, {
  sequelize,
  modelName: 'Profile',
});

class Contract extends Sequelize.Model {}
Contract.init(contractFields, {
  sequelize,
  modelName: 'Contract',
});

class Job extends Sequelize.Model {}
Job.init(jobFields, {
  sequelize,
  modelName: 'Job',
});

Profile.hasMany(Contract, { as: 'Contractor', foreignKey: 'ContractorId' });
Contract.belongsTo(Profile, { as: 'Contractor' });

Profile.hasMany(Contract, { as: 'Client', foreignKey: 'ClientId' });
Contract.belongsTo(Profile, { as: 'Client' });

Contract.hasMany(Job);
Job.belongsTo(Contract);

module.exports = {
  sequelize,
  Profile,
  Contract,
  Job,
};
