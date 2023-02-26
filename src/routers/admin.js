const express = require('express');
const { Op } = require('sequelize');

const { PROFILE_TYPE } = require('../models/profile');
const { isNonNegativeNumber } = require('../helpers/isNumber');
const authAdminMiddleware = require('../middlewares/auth-admin');

const router = express.Router();

router.use(authAdminMiddleware);

/**
 * Get profession that earned the most at a given time
 * --- I assumed that only paid jobs matter
 * @param {string} req.query.start - timestamp
 * @param {string} req.query.end - timestamp
 * @returns ---------------------------------
 */
router.get('/best-profession', async (req, res) => {
  const { start, end } = req.query;

  // date range validation
  if ((start && !isNonNegativeNumber(start)) || (end && !isNonNegativeNumber(end))) {
    return res.status(400).json({
      start, end, message: 'given time rage is invalid',
    });
  }

  // maybe move this monstrosity of logic to somewhere else
  const filterDate = {};
  if (start || end) {
    if (start && end) {
      filterDate.paymentDate = { [Op.between]: [new Date(Number(start)), new Date(Number(end))] };
    } else if (start) {
      filterDate.paymentDate = { [Op.gte]: new Date(Number(start)) };
    } else if (end) {
      filterDate.paymentDate = { [Op.lte]: new Date(Number(end)) };
    }
  }

  const sequelize = req.app.get('sequelize');
  const { Profile, Contract, Job } = req.app.get('models');

  const professions = await Profile.findAll({
    raw: true,
    attributes: [
      'profession',
      [sequelize.fn('SUM', sequelize.col('Contractor.Jobs.price')), 'jobsPriceSum'],
      // these 4 are not really necessary it's just to be sure that query works properly
      [sequelize.fn('COUNT', sequelize.col('Contractor.Jobs.id')), 'jobsCount'],
      [sequelize.fn('GROUP_CONCAT', sequelize.col('Contractor.Jobs.id')), 'jobIds'],
      [sequelize.fn('GROUP_CONCAT', sequelize.col('Contractor.Jobs.price')), 'jobsPrice'],
      [sequelize.fn('GROUP_CONCAT', sequelize.col('Contractor.Jobs.paymentDate')), 'jobsPaymentDate'],
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
    if (current.jobsPriceSum > best.jobsPriceSum) best = { ...current };
    return best;
  }, { jobsPriceSum: 0 });

  if (!bestProfession.jobsPriceSum) {
    return res.json({
      start, end, message: 'not jobs found fot the given date range',
    });
  }

  return res.json({
    ...bestProfession,
  });
});

module.exports = router;
