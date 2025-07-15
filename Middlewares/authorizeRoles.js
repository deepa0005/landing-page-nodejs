// middlewares/authorizeRoles.js
module.exports = function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user || req.session; // Support both JWT & session auth

    const role = user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Access denied. Only allowed roles can access this route.' });
    }

    next();
  };
};
