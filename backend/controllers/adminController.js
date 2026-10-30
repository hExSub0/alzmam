const User = require("../models/User");
const Session = require("../models/Session");
const AppError = require("../utils/AppError");

const USER_LIST_FIELDS = "name email role isEmailVerified isActive createdAt updatedAt";

const formatUpdatedUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

const listUsers = async (req, res) => {
  const { page, limit } = req.validatedQuery;
  const skip = (page - 1) * limit;

  const usersQuery = User.find()
    .select(USER_LIST_FIELDS)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const totalUsersQuery = User.countDocuments();

  const [users, total] = await Promise.all([usersQuery, totalUsersQuery]);

  res.json({ users, page, limit, total });
};

const getUser = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).select(USER_LIST_FIELDS);

  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  res.json({ user });
};

const updateRole = async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = String(req.user._id);
  const requestedRole = req.body.role;
  const isCurrentUser = targetUserId.toLowerCase() === currentUserId.toLowerCase();

  if (isCurrentUser) {
    throw new AppError(400, "You cannot change your own role", "SELF_ROLE_CHANGE");
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const isDemotingAdmin = user.role === "admin" && requestedRole === "user";
  if (isDemotingAdmin && user.isActive) {
    const activeAdminCount = await User.countDocuments({ role: "admin", isActive: true });
    const isLastActiveAdmin = activeAdminCount <= 1;

    if (isLastActiveAdmin) {
      throw new AppError(409, "The last active administrator cannot be demoted", "LAST_ADMIN");
    }
  }

  user.role = requestedRole;
  await user.save();

  res.json({ user: formatUpdatedUser(user) });
};

const updateStatus = async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = String(req.user._id);
  const requestedStatus = req.body.isActive;
  const isCurrentUser = targetUserId.toLowerCase() === currentUserId.toLowerCase();
  const isDeactivatingUser = requestedStatus === false;

  if (isCurrentUser && isDeactivatingUser) {
    throw new AppError(400, "You cannot deactivate your own account", "SELF_DEACTIVATION");
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const isDeactivatingActiveAdmin = user.role === "admin" && user.isActive && isDeactivatingUser;
  if (isDeactivatingActiveAdmin) {
    const activeAdminCount = await User.countDocuments({ role: "admin", isActive: true });
    const isLastActiveAdmin = activeAdminCount <= 1;

    if (isLastActiveAdmin) {
      throw new AppError(409, "The last active administrator cannot be deactivated", "LAST_ADMIN");
    }
  }

  user.isActive = requestedStatus;
  await user.save();

  if (isDeactivatingUser) {
    await Session.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  res.json({ user: formatUpdatedUser(user) });
};

module.exports = {
  listUsers,
  getUser,
  updateRole,
  updateStatus,
};
