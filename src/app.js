const express = require('express');
const bodyParser = require('body-parser');

const errorHandler = require('./error-handler');
const logger = require('./logger');
const { sequelize } = require('./models');
const contractsRouter = require('./routers/contracts');
const jobsRouter = require('./routers/jobs');
const balancesRouter = require('./routers/balances');
const adminRouter = require('./routers/admin');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

// logger
app.use(logger);

// setting up the routers
app.use('/contracts', contractsRouter);
app.use('/jobs', jobsRouter);
app.use('/balances', balancesRouter);
app.use('/admin', adminRouter);

// not found
app.use((req, res) => res.status(404).end());

// default error handler
app.use(errorHandler);

module.exports = app;
