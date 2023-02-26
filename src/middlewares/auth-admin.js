/** --------------------------------------------------
 * It's not just a duplicate of "auth-profile.js"
 * You just need to assume that
 * Admins have a completely different auth logic ;)
 * -------------------------------------------------- */

const { PROFILE_TYPE } = require('../models/profile');

module.exports = async (req, res, next) => {
  const { Profile } = req.app.get('models');

  const admin = await Profile.findOne({
    where: {
      id: req.get('admin_id') || 0,
      type: PROFILE_TYPE.ADMIN,
    },
  });

  // 404 as regular users don't even need to know that such route exists
  if (!admin) return res.status(404).end();
  req.admin = admin;

  return next();
};
