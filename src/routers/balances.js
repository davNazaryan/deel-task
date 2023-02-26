const express = require('express');
const { Op } = require('sequelize');

const { CONTRACT_STATUS } = require('../models/contract');
const { PROFILE_TYPE } = require('../models/profile');

const router = express.Router();

/**
 * Deposit money into account
 * @param {string} req.params.userId
 * @param {number} req.body.amount
 * @returns {Object} res
 * @returns {number} res.currentBalance
 * @returns {number} res.message
 * @returns {number} [res.maxAllowedDeposit] - returned only on 400 error
 */
router.post('/deposit/:userId', async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  const sequelize = req.app.get('sequelize');
  const { Profile, Contract, Job } = req.app.get('models');

  const profile = await Profile.findOne({
    where: { id: userId },
    attributes: ['id', 'type', 'balance'],
  });

  if (!profile) return res.status(404).end();
  if (profile.type !== PROFILE_TYPE.CLIENT) {
    return res.status(403).json({
      message: 'Contractors are not allowed ot deposit money',
    });
  }

  const jobs = await Job.findAll({
    raw: true,
    attributes: [
      [sequelize.fn('SUM', sequelize.col('price')), 'totalToPay'],
    ],
    where: {
      paid: { [Op.not]: true },
    },
    include: {
      model: Contract,
      required: true,
      attributes: [], // we don't need to select anything from contracts
      where: {
        status: { [Op.not]: CONTRACT_STATUS.TERMINATED },
        ClientId: userId,
      },
    },
  });

  const { totalToPay } = jobs[0];
  const maxAllowedDeposit = Math.floor(totalToPay * 25) / 100; // 25% of totalToPay to 2 decimal

  if (maxAllowedDeposit < amount) {
    return res.status(403).json({
      message: 'Maximum allowed amount of deposit is 25% ot your total jobs to pay',
      maxAllowedDeposit,
    });
  }

  await profile.increment('balance', { by: amount });

  return res.json({
    message: 'funds successfully added',
    currentBalance: profile.balance,
  });
});

module.exports = router;
