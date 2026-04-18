const { verifyClerkJwt } = require('../lib/clerkAuth');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = await verifyClerkJwt(token);
    const userId = payload.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = { id: userId };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireAuth,
};
