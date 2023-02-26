const express = require('express');
const { Op } = require('sequelize');

const { CONTRACT_STATUS } = require('../models/contract');
const authProfileMiddleware = require('../middlewares/auth-profile');

const router = express.Router();

// an auth gate for every contract route
router.use(authProfileMiddleware);

/**
 * Get all unpaid jobs
 * @returns {Job[]} jobs or 404 if no job found
 */
router.get('/unpaid', async (req, res) => {
  const { id: profileId } = req.profile;
  const { Job, Contract } = req.app.get('models');

  const jobs = await Job.findAll({
    where: {
      paid: { [Op.not]: true },
    },
    include: {
      model: Contract,
      required: true,
      attributes: [], // we don't need to select anything from contracts
      where: {
        status: CONTRACT_STATUS.IN_PROGRESS,
        [Op.or]: {
          ContractorId: profileId,
          ClientId: profileId,
        },
      },
    },
  });
  /** --------------------------------------------------
   * Each Contract can have multiple Jobs, so there is more Jobs than Contracts.
   * This means that selecting over Contract table than joining Job TABLE
   * would be a faster SQL query. Which is true.
   *
   * However, if we select Contracts first we need to transform data via node.js.
   * Which will make the hole request work slower and consume more computational resources.
   * -------------------------------------------------- */

  if (!jobs) return res.status(404).end();
  return res.json(jobs);
});

/**
 * Pay the unpaid job
 * @returns {Object} res
 * @returns {string} res.status
 * @returns {number} res.jobId
 * @returns {number} res.currentBalance
 */
router.post('/:jobId/pay', async (req, res, next) => {
  const { jobId } = req.params;
  const { id: profileId } = req.profile;
  const { Job, Contract, Profile } = req.app.get('models');
  const sequelize = req.app.get('sequelize');

  const job = await Job.findOne({
    attributes: ['id', 'price', 'ContractId'],
    where: {
      id: jobId,
      paid: { [Op.not]: true },
    },
    include: {
      model: Contract,
      required: true,
      attributes: ['ContractorId'], // we don't need to select anything from contracts
      where: {
        status: CONTRACT_STATUS.IN_PROGRESS,
        ClientId: profileId,
      },
      include: [{
        model: Profile,
        as: 'Client',
        required: true,
        attributes: ['balance'],
      },
      {
        model: Profile,
        as: 'Contractor',
        required: true,
        attributes: ['balance'],
      }],
    },
  });

  if (!job) return res.status(404).end();

  // javascript is pretty silly with math
  const clientFundsAfterTransaction =
    Number((job.Contract.Client.balance - job.price).toFixed(2));
  const contractorFundsAfterTransaction =
    Number((job.Contract.Contractor.balance + job.price).toFixed(2));

  // insufficient funds
  if (clientFundsAfterTransaction <= 0) return res.status(402).end();

  return sequelize.transaction(async (t) => {
    await Profile.update({ balance: clientFundsAfterTransaction }, {
      where: { id: profileId },
      transaction: t,
    });

    await Profile.update({ balance: contractorFundsAfterTransaction }, {
      where: { id: job.Contract.ContractorId },
      transaction: t,
    });

    await Job.update({ paid: true }, {
      where: { id: job.id },
      transaction: t,
    });
  })
    .then(() => res.json({
      status: 'success',
      jobId: job.id,
      currentBalance: clientFundsAfterTransaction,
    }))
    .catch((err) => next(err));
});

module.exports = router;
