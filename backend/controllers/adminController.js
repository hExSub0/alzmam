const User = require("../models/User");
const AppError = require("../utils/AppError");

const listUsers = async (req, res) => {
  const { page, limit } = req.validatedQuery;
  const [users, total] = await Promise.all([
    User.find().select("name email role isEmailVerified isActive createdAt updatedAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(),
  ]);
  res.json({ users, page, limit, total });
};

const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select("name email role isEmailVerified isActive createdAt updatedAt");
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  res.json({ user });
};

const updateRole = async (req, res) => {
  if (req.params.id === String(req.user._id)) throw new AppError(400, "You cannot change your own role", "SELF_ROLE_CHANGE");
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  if (user.role === "admin" && req.body.role === "user") {
    const admins = await User.countDocuments({ role: "admin", isActive: true });
    if (user.isActive && admins <= 1) throw new AppError(409, "The last active administrator cannot be demoted", "LAST_ADMIN");
  }
  user.role = req.body.role;
  await user.save();
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
};

const updateStatus = async (req, res) => {
  if (req.params.id === String(req.user._id) && !req.body.isActive) throw new AppError(400, "You cannot deactivate your own account", "SELF_DEACTIVATION");
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  if (user.role === "admin" && user.isActive && !req.body.isActive) {
    const admins = await User.countDocuments({ role: "admin", isActive: true });
    if (admins <= 1) throw new AppError(409, "The last active administrator cannot be deactivated", "LAST_ADMIN");
  }
  user.isActive = req.body.isActive;
  await user.save();
  if (!user.isActive) {
    const Session = require("../models/Session");
    await Session.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
};

module.exports = { listUsers, getUser, updateRole, updateStatus };
