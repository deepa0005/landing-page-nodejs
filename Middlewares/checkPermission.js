module.exports = (permissionKey) => {
  return (req, res, next) => {
    const user = req.user || req.session;
    try {
      const permissions = typeof user.permissions === 'string'
        ? JSON.parse(user.permissions)
        : user.permissions;

      if (!permissions || !permissions[permissionKey]) {
        return res.status(403).json({ message: 'Access denied: insufficient permission' });
      }

      next();
    } catch (err) {
      return res.status(403).json({ message: 'Access denied: invalid permissions' });
    }
  };
};
