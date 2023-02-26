const express = require('express');
const { Op } = require('sequelize');

const { CONTRACT_STATUS } = require('../models/contract');
const authProfileMiddleware = require('../middlewares/auth-profile');

const router = express.Router();

// an auth gate for every contract route
router.use(authProfileMiddleware);

/**
 * Get the owned contract by id.
 * @param {string} req.params.contractId
 * @returns {Contract} contract or 404 if not found
 */
router.get('/:contractId', async (req, res) => {
  const { contractId } = req.params;
  const { id: profileId } = req.profile;
  const { Contract } = req.app.get('models');

  const contract = await Contract.findOne({
    where: {
      id: contractId,
      [Op.or]: {
        ContractorId: profileId,
        ClientId: profileId,
      },
    },
  });

  if (!contract) return res.status(404).end();
  return res.json(contract);
});

/**
 * Get the list of owned contracts not terminated
 * @returns {Contract[]} contracts or 404 if no contract found
 */
router.get('/', async (req, res) => {
  const { id: profileId } = req.profile;
  const { Contract } = req.app.get('models');

  const contracts = await Contract.findAll({
    where: {
      status: { [Op.ne]: CONTRACT_STATUS.TERMINATED },
      [Op.or]: {
        ContractorId: profileId,
        ClientId: profileId,
      },
    },
  });
  // TODO missing pagination

  if (!contracts.length) return res.status(404).end();
  return res.json(contracts);
});

module.exports = router;
