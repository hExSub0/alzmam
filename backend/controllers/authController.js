const crypto = require("node:crypto");
const mongoose = require("mongoose");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Session = require("../models/Session");
const AppError = require("../utils/AppError");
const { hashToken, createOpaqueToken, signAccessToken, signRefreshToken } = require("../utils/tokens");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const { issueCsrfToken } = require("../middlewares/csrf");
const { sendVerificationCode, sendPasswordReset } = require("../utils/email");

const otpHash = (code) => crypto.createHmac("sha256", process.env.COOKIE_SECRET).update(code).digest("hex");
const genericCredentialsError = () => new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
let dummyPasswordHash;

const getRefreshExpiry = (token) => {
  const { exp } = jwt.decode(token);
  return new Date(exp * 1000);
};

const createSession = async (user, req, res) => {
  const sessionId = new mongoose.Types.ObjectId().toString();
  const refreshToken = signRefreshToken(user.id, sessionId);
  await Session.create({
    _id: sessionId,
    user: user._id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: getRefreshExpiry(refreshToken),
    device: String(req.get("user-agent") || "").slice(0, 300),
    ipAddress: String(req.ip || "").slice(0, 64),
  });
  const csrfToken = issueCsrfToken();
  setAuthCookies(res, refreshToken, csrfToken);
  return { accessToken: signAccessToken(user), csrfToken };
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
});

const register = async (req, res) => {
  const { name, firstName, lastName, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();
  const fullName = name || `${firstName} ${lastName}`;
  const existing = await User.exists({ email: normalizedEmail });
  if (existing) throw new AppError(409, "An account with this email already exists", "EMAIL_EXISTS");

  const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
  const code = String(crypto.randomInt(100000, 1000000));
  const user = await User.create({
    name: fullName,
    email: normalizedEmail,
    password: hashedPassword,
    role: "user",
    emailVerificationHash: otpHash(code),
    emailVerificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    emailVerificationAttempts: 0,
    emailVerificationSentAt: new Date(),
  });
  await sendVerificationCode(user.email, code);
  res.status(201).json({ message: "Account created. Check your email for the verification code.", user: publicUser(user) });
};

const login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select("+password");
  if (!dummyPasswordHash) dummyPasswordHash = await argon2.hash("not-a-real-account-password", { type: argon2.argon2id });
  const validPassword = await argon2.verify(user?.password || dummyPasswordHash, req.body.password).catch(() => false);
  if (!user || !user.isActive) throw genericCredentialsError();
  if (!validPassword || !user.isEmailVerified) throw genericCredentialsError();
  const tokens = await createSession(user, req, res);
  res.json({ ...tokens, user: publicUser(user) });
};

const csrf = (_req, res) => {
  const csrfToken = issueCsrfToken();
  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
  res.json({ csrfToken });
};

const refresh = async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    clearAuthCookies(res);
    throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { issuer: "eco-api", audience: "eco-refresh" });
  } catch {
    clearAuthCookies(res);
    throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
  }

  const session = await Session.findOne({ _id: payload.sid, user: payload.sub, revokedAt: null }).select("+refreshTokenHash");
  if (!session) {
    clearAuthCookies(res);
    throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
  }
  if (session.refreshTokenHash !== hashToken(token)) {
    await Session.updateMany({ user: session.user, revokedAt: null }, { $set: { revokedAt: new Date() } });
    clearAuthCookies(res);
    throw new AppError(401, "Refresh token reuse detected. Please sign in again.", "REFRESH_REUSE");
  }

  const user = await User.findOne({ _id: session.user, isActive: true, isEmailVerified: true });
  if (!user) {
    await Session.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    clearAuthCookies(res);
    throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
  }

  const nextToken = signRefreshToken(user.id, String(session._id));
  const updated = await Session.findOneAndUpdate(
    { _id: session._id, revokedAt: null, refreshTokenHash: hashToken(token) },
    { $set: { refreshTokenHash: hashToken(nextToken), expiresAt: getRefreshExpiry(nextToken) } },
    { new: true },
  );
  if (!updated) {
    await Session.updateMany({ user: session.user, revokedAt: null }, { $set: { revokedAt: new Date() } });
    clearAuthCookies(res);
    throw new AppError(401, "Refresh token reuse detected. Please sign in again.", "REFRESH_REUSE");
  }
  const csrfToken = issueCsrfToken();
  setAuthCookies(res, nextToken, csrfToken);
  res.json({ accessToken: signAccessToken(user), csrfToken, user: publicUser(user) });
};

const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { issuer: "eco-api", audience: "eco-refresh", ignoreExpiration: true });
      const session = await Session.findOne({ _id: payload.sid, user: payload.sub }).select("+refreshTokenHash");
      if (session && session.refreshTokenHash === hashToken(token)) {
        await Session.updateOne({ _id: session._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
      }
    } catch {}
  }
  clearAuthCookies(res);
  res.status(204).end();
};

const logoutAll = async (req, res) => {
  await Session.updateMany({ user: req.user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  clearAuthCookies(res);
  res.status(204).end();
};

const me = (req, res) => res.json({ user: publicUser(req.user) });

const verifyEmail = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+emailVerificationHash +emailVerificationExpiresAt +emailVerificationAttempts");
  const invalid = () => new AppError(400, "Invalid or expired verification code", "INVALID_CODE");
  if (!user || user.isEmailVerified || !user.emailVerificationHash || user.emailVerificationExpiresAt < new Date()) throw invalid();
  if (user.emailVerificationAttempts >= 5) throw invalid();
  user.emailVerificationAttempts += 1;
  const expectedHash = Buffer.from(user.emailVerificationHash);
  const providedHash = Buffer.from(otpHash(req.body.code));
  if (expectedHash.length !== providedHash.length || !crypto.timingSafeEqual(expectedHash, providedHash)) {
    if (user.emailVerificationAttempts >= 5) user.emailVerificationHash = undefined;
    await user.save();
    throw invalid();
  }
  user.isEmailVerified = true;
  user.emailVerificationHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  user.emailVerificationAttempts = 0;
  await user.save();
  res.json({ message: "Email verified successfully" });
};

const resendVerification = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+emailVerificationSentAt +emailVerificationHash +emailVerificationExpiresAt +emailVerificationAttempts");
  if (user && !user.isEmailVerified) {
    if (user.emailVerificationSentAt && Date.now() - user.emailVerificationSentAt.getTime() < 60_000) {
      throw new AppError(429, "Please wait before requesting another code", "RESEND_COOLDOWN");
    }
    const code = String(crypto.randomInt(100000, 1000000));
    user.emailVerificationHash = otpHash(code);
    user.emailVerificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.emailVerificationAttempts = 0;
    user.emailVerificationSentAt = new Date();
    await user.save();
    await sendVerificationCode(user.email, code);
  }
  res.json({ message: "If the account needs verification, a code has been sent." });
};

const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user && user.isActive) {
    const token = createOpaqueToken();
    user.passwordResetHash = hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    await sendPasswordReset(user.email, token);
  }
  res.json({ message: "If an account exists, password reset instructions have been sent." });
};

const resetPassword = async (req, res) => {
  const user = await User.findOne({ passwordResetHash: hashToken(req.body.token), passwordResetExpiresAt: { $gt: new Date() } });
  if (!user) throw new AppError(400, "Invalid or expired reset token", "INVALID_RESET_TOKEN");
  user.password = await argon2.hash(req.body.password, { type: argon2.argon2id });
  user.passwordChangedAt = new Date();
  user.passwordResetHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  await Session.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  res.json({ message: "Password reset successfully. Please sign in again." });
};

const changePassword = async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  const valid = await argon2.verify(user.password, req.body.currentPassword).catch(() => false);
  if (!valid) throw new AppError(400, "Current password is incorrect", "INVALID_PASSWORD");
  user.password = await argon2.hash(req.body.password, { type: argon2.argon2id });
  user.passwordChangedAt = new Date();
  await user.save();
  await Session.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  clearAuthCookies(res);
  res.json({ message: "Password changed. Please sign in again." });
};

const listSessions = async (req, res) => {
  const sessions = await Session.find({ user: req.user._id, revokedAt: null, expiresAt: { $gt: new Date() } })
    .select("device ipAddress createdAt expiresAt")
    .sort({ createdAt: -1 });
  res.json({ sessions });
};

const revokeSession = async (req, res) => {
  const result = await Session.updateOne({ _id: req.params.id, user: req.user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  if (!result.modifiedCount) throw new AppError(404, "Session not found", "SESSION_NOT_FOUND");
  res.status(204).end();
};

module.exports = {
  register, login, csrf, refresh, logout, logoutAll, me, verifyEmail,
  resendVerification, forgotPassword, resetPassword, changePassword,
  listSessions, revokeSession,
};
