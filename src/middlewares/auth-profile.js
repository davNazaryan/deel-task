module.exports = async (req, res, next) => {
  const { Profile } = req.app.get('models');

  // TODO JWT auth goes here

  const profile = await Profile.findOne({
    where: { id: req.get('profile_id') || 0 },
  });

  // 401 is "unauthorized"
  if (!profile) return res.status(401).end();
  req.profile = profile;

  return next();
};
