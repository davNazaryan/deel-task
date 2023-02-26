const express = require('express');

const { PROFILE_TYPE } = require('../models/profile');
const { isNonNegativeNumber } = require('../helpers/isNumber');
const aggregateDateRange = require('../helpers/aggregateDateRange');
const authAdminMiddleware = require('../middlewares/auth-admin');

const router = express.Router();

router.use(authAdminMiddleware);

/**
 * Get profession that earned the most at a given time
 * --- I assumed that only paid jobs matter
 * @param {string} req.query.start - timestamp
 * @param {string} req.query.end - timestamp
 * @returns {Profile[]} res - in success case, it's actually extended profile
 * @returns {string} [res.start] - if bad request or no jobs found
 * @returns {string} [res.end] - if bad request or no jobs found
 * @returns {string} [res.message] - if bad request or no jobs found
 * @returns {string} res.profession
 * @returns {number} res.jobPricesSum
 * @returns {number} res.jobsCount
 * @returns {string} res.jobIds
 * @returns {string} res.jobsPrices
 * @returns {string} res.jobsPaymentDates
 */
router.get('/best-profession', async (req, res) => {
  const { start, end } = req.query;
  const sequelize = req.app.get('sequelize');
  const { Profile, Contract, Job } = req.app.get('models');

  const { success, filterDate } = aggregateDateRange(start, end);
  if (!success) {
    return res.status(400).json({
      start, end, message: 'given time rage is invalid',
    });
  }

  const professions = await Profile.findAll({
    raw: true,
    attributes: [
      'profession',
      [sequelize.fn('SUM', sequelize.col('Contractor.Jobs.price')), 'jobPricesSum'],
      // these 4 are not really necessary it's just to be sure that query works properly
      [sequelize.fn('COUNT', sequelize.col('Contractor.Jobs.id')), 'jobsCount'],
      [sequelize.fn('GROUP_CONCAT', sequelize.col('Contractor.Jobs.id')), 'jobIds'],
      [sequelize.fn('GROUP_CONCAT', sequelize.col('Contractor.Jobs.price')), 'jobsPrices'],
      [sequelize.fn('GROUP_CONCAT', sequelize.col('Contractor.Jobs.paymentDate')), 'jobsPaymentDates'],
    ],
    where: { type: PROFILE_TYPE.CONTRACTOR },
    group: 'Profile.profession',
    include: {
      model: Contract,
      as: 'Contractor',
      required: true,
      attributes: [],
      include: {
        model: Job,
        required: true,
        attributes: [],
        where: {
          ...filterDate,
          paid: true,
        },
      },
    },
  });

  const bestProfession = professions.reduce((best, current) => {
    // eslint-disable-next-line no-param-reassign
    if (current.jobPricesSum > best.jobPricesSum) best = { ...current };
    return best;
  }, { jobPricesSum: 0 });

  if (!bestProfession.jobPricesSum) {
    return res.json({
      start, end, message: 'not jobs found fot the given date range',
    });
  }

  return res.json(bestProfession);
});

/**
 * Get clients that paid the most at a given time
 * @param {string} req.query.start - timestamp
 * @param {string} req.query.end - timestamp
 * @param {string} req.query.end - limit
 * @returns {Object} res
 * @returns {string} [res.start] - if bad request or no jobs found
 * @returns {string} [res.end] - if bad request or no jobs found
 * @returns {string} [res.limit] - if bad request
 * @returns {string} [res.message] - if bad request or no jobs found
 */
router.get('/best-clients', async (req, res) => {
  const { start, end, limit = '2' } = req.query;
  const sequelize = req.app.get('sequelize');
  const { Profile, Contract, Job } = req.app.get('models');

  // validate limit
  if (!isNonNegativeNumber(limit)) {
    return res.status(400).json({
      limit, message: 'limit should be a positive integer',
    });
  }

  const { success, filterDate } = aggregateDateRange(start, end);
  if (!success) {
    return res.status(400).json({
      start, end, message: 'given time rage is invalid',
    });
  }

  const clients = await Profile.findAll({
    raw: true,
    limit: parseInt(limit, 10),
    attributes: {
      include: [
        [sequelize.fn('SUM', sequelize.col('Client.Jobs.price')), 'jobPricesSum'],
        // unnecessary fields bellow, it's just for statistics
        [sequelize.fn('COUNT', sequelize.col('Client.Jobs.id')), 'jobsCount'],
        [sequelize.fn('GROUP_CONCAT', sequelize.col('Client.Jobs.price')), 'jobPrices'],
        [sequelize.fn('GROUP_CONCAT', sequelize.col('Client.Jobs.id')), 'jobIds'],
      ],
    },
    where: { type: PROFILE_TYPE.CLIENT },
    group: 'Profile.id',
    order: [['jobPricesSum', 'ASC']],
    include: {
      model: Contract,
      as: 'Client',
      required: true,
      // this wired workaround helps sequelize to generate proper SQL query, kudos to https://github.com/sequelize/sequelize/issues/6025#issuecomment-223883856
      duplicating: false,
      attributes: [],
      include: {
        model: Job,
        required: true,
        duplicating: false,
        attributes: [],
        where: {
          ...filterDate,
          paid: true,
        },
      },
    },
  });

  return res.json(clients);
});

module.exports = router;
