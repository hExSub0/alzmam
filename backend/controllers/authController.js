const crypto = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Algorithm, hash, verify } = require("@node-rs/argon2");
const User = require("../models/User");
const Session = require("../models/Session");
const AppError = require("../utils/AppError");
const {
  hashToken,
  createOpaqueToken,
  signAccessToken,
  signRefreshToken,
} = require("../utils/tokens");
const { setCsrfCookie, setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const { issueCsrfToken } = require("../middlewares/csrf");
const { sendVerificationCode, sendPasswordReset } = require("../utils/email");

const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
};
const EMAIL_VERIFICATION_TTL_MS = 10 * 60 * 1000;
const EMAIL_VERIFICATION_COOLDOWN_MS = 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const MAX_EMAIL_VERIFICATION_ATTEMPTS = 5;
const INVALID_CREDENTIALS_MESSAGE = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
const INVALID_CREDENTIALS_CODE = "INVALID_CREDENTIALS";
const DUMMY_PASSWORD = "not-a-real-account-password";

let dummyPasswordHashPromise;

const hashPassword = (password) => hash(password, ARGON2_OPTIONS);

const hashVerificationCode = (code) => crypto
  .createHmac("sha256", process.env.COOKIE_SECRET)
  .update(code)
  .digest("hex");

const getRefreshExpiration = (refreshToken) => {
  const decodedToken = jwt.decode(refreshToken);
  return new Date(decodedToken.exp * 1000);
};

const getDummyPasswordHash = () => {
  if (!dummyPasswordHashPromise) {
    dummyPasswordHashPromise = hashPassword(DUMMY_PASSWORD);
  }

  return dummyPasswordHashPromise;
};

const createSession = async (user, req, res) => {
  const sessionId = new mongoose.Types.ObjectId().toString();
  const refreshToken = signRefreshToken(user.id, sessionId);
  const sessionExpiration = getRefreshExpiration(refreshToken);
  const userAgent = String(req.get("user-agent") || "").slice(0, 300);
  const ipAddress = String(req.ip || "").slice(0, 64);

  await Session.create({
    _id: sessionId,
    user: user._id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: sessionExpiration,
    device: userAgent,
    ipAddress,
  });

  const csrfToken = issueCsrfToken();
  setAuthCookies(res, refreshToken, csrfToken);

  return {
    accessToken: signAccessToken(user),
    csrfToken,
  };
};

const createPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
});

const createInvalidCredentialsError = () => new AppError(
  401,
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_CREDENTIALS_CODE,
);

const revokeUserSessions = async (userId) => {
  const currentTime = new Date();

  await Session.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: currentTime } },
  );
};

const register = async (req, res) => {
  const { name, firstName, lastName, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();
  const fullName = name || `${firstName} ${lastName}`;

  const existingUser = await User.findOne({ email: normalizedEmail }).select(
    "+password +emailVerificationHash +emailVerificationExpiresAt +emailVerificationAttempts +emailVerificationSentAt",
  );
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new AppError(409, "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.", "EMAIL_EXISTS");
    }

    const passwordMatches = await verify(existingUser.password, password).catch(() => false);
    if (!passwordMatches) {
      throw new AppError(409, "يوجد طلب تسجيل بهذا البريد. استخدم كلمة المرور التي أدخلتها عند التسجيل أو سجّل الدخول.", "EMAIL_EXISTS");
    }

    const verificationCode = String(crypto.randomInt(100000, 1000000));
    existingUser.emailVerificationHash = hashVerificationCode(verificationCode);
    existingUser.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    existingUser.emailVerificationAttempts = 0;
    existingUser.emailVerificationSentAt = new Date();
    await existingUser.save();
    await sendVerificationCode(existingUser.email, verificationCode);

    return res.status(200).json({
      message: "أرسلنا رمز تحقق جديدًا إلى بريدك الإلكتروني.",
      user: createPublicUser(existingUser),
    });
  }

  const existingUserCount = await User.countDocuments();
  const isFirstUser = existingUserCount === 0;
  const userRole = isFirstUser ? "admin" : "user";

  const hashedPassword = await hashPassword(password);
  const verificationCode = String(crypto.randomInt(100000, 1000000));
  const verificationExpiration = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  const user = await User.create({
    name: fullName,
    email: normalizedEmail,
    password: hashedPassword,
    role: userRole,
    emailVerificationHash: hashVerificationCode(verificationCode),
    emailVerificationExpiresAt: verificationExpiration,
    emailVerificationAttempts: 0,
    emailVerificationSentAt: new Date(),
  });

  await sendVerificationCode(user.email, verificationCode);

  res.status(201).json({
    message: "تم إنشاء الحساب. تحقق من بريدك الإلكتروني للحصول على رمز التحقق.",
    user: createPublicUser(user),
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +emailVerificationHash +emailVerificationExpiresAt +emailVerificationAttempts +emailVerificationSentAt",
  );
  const passwordHash = user ? user.password : await getDummyPasswordHash();
  const isPasswordValid = await verify(passwordHash, password).catch(() => false);

  if (!user || !user.isActive || !isPasswordValid) {
    throw createInvalidCredentialsError();
  }

  if (!user.isEmailVerified) {
    const lastCodeSentAt = user.emailVerificationSentAt?.getTime() || 0;
    const cooldownHasPassed = Date.now() - lastCodeSentAt >= EMAIL_VERIFICATION_COOLDOWN_MS;

    if (cooldownHasPassed) {
      const verificationCode = String(crypto.randomInt(100000, 1000000));
      user.emailVerificationHash = hashVerificationCode(verificationCode);
      user.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
      user.emailVerificationAttempts = 0;
      user.emailVerificationSentAt = new Date();
      await user.save();
      await sendVerificationCode(user.email, verificationCode);
    }

    throw new AppError(
      403,
      "يرجى إدخال رمز التحقق المرسل إلى بريدك الإلكتروني.",
      "EMAIL_NOT_VERIFIED",
    );
  }

  const tokens = await createSession(user, req, res);

  res.json({
    ...tokens,
    user: createPublicUser(user),
  });
};

const csrf = (_req, res) => {
  const csrfToken = issueCsrfToken();
  setCsrfCookie(res, csrfToken);

  res.json({ csrfToken });
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    clearAuthCookies(res);
    throw new AppError(401, "يرجى تسجيل الدخول للمتابعة.", "AUTH_REQUIRED");
  }

  let tokenPayload;
  try {
    tokenPayload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      { issuer: "eco-api", audience: "eco-refresh" },
    );
  } catch {
    clearAuthCookies(res);
    throw new AppError(401, "يرجى تسجيل الدخول للمتابعة.", "AUTH_REQUIRED");
  }

  const session = await Session.findOne({
    _id: tokenPayload.sid,
    user: tokenPayload.sub,
    revokedAt: null,
  }).select("+refreshTokenHash");

  if (!session) {
    clearAuthCookies(res);
    throw new AppError(401, "يرجى تسجيل الدخول للمتابعة.", "AUTH_REQUIRED");
  }

  const storedTokenHashMatches = session.refreshTokenHash === hashToken(refreshToken);
  if (!storedTokenHashMatches) {
    await revokeUserSessions(session.user);
    clearAuthCookies(res);
    throw new AppError(401, "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.", "REFRESH_REUSE");
  }

  const user = await User.findOne({
    _id: session.user,
    isActive: true,
    isEmailVerified: true,
  });

  if (!user) {
    const currentTime = new Date();
    await Session.updateOne(
      { _id: session._id },
      { $set: { revokedAt: currentTime } },
    );
    clearAuthCookies(res);
    throw new AppError(401, "يرجى تسجيل الدخول للمتابعة.", "AUTH_REQUIRED");
  }

  const nextRefreshToken = signRefreshToken(user.id, String(session._id));
  const nextRefreshTokenHash = hashToken(nextRefreshToken);
  const nextSessionExpiration = getRefreshExpiration(nextRefreshToken);
  const updatedSession = await Session.findOneAndUpdate(
    {
      _id: session._id,
      revokedAt: null,
      refreshTokenHash: hashToken(refreshToken),
    },
    {
      $set: {
        refreshTokenHash: nextRefreshTokenHash,
        expiresAt: nextSessionExpiration,
      },
    },
    { new: true },
  );

  if (!updatedSession) {
    await revokeUserSessions(session.user);
    clearAuthCookies(res);
    throw new AppError(401, "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.", "REFRESH_REUSE");
  }

  const csrfToken = issueCsrfToken();
  setAuthCookies(res, nextRefreshToken, csrfToken);

  res.json({
    accessToken: signAccessToken(user),
    csrfToken,
    user: createPublicUser(user),
  });
};

const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    let tokenPayload;

    try {
      tokenPayload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        {
          issuer: "eco-api",
          audience: "eco-refresh",
          ignoreExpiration: true,
        },
      );
    } catch {
      tokenPayload = null;
    }

    if (tokenPayload) {
      const session = await Session.findOne({
        _id: tokenPayload.sid,
        user: tokenPayload.sub,
      }).select("+refreshTokenHash");

      const hasCurrentRefreshToken = session
        && session.refreshTokenHash === hashToken(refreshToken);

      if (hasCurrentRefreshToken) {
        const currentTime = new Date();
        await Session.updateOne(
          { _id: session._id, revokedAt: null },
          { $set: { revokedAt: currentTime } },
        );
      }
    }
  }

  clearAuthCookies(res);
  res.status(204).end();
};

const logoutAll = async (req, res) => {
  const userId = req.user._id;

  await revokeUserSessions(userId);
  clearAuthCookies(res);
  res.status(204).end();
};

const me = (req, res) => {
  const user = req.user;
  res.json({ user: createPublicUser(user) });
};

const deleteAccount = async (req, res) => {
  const userId = req.user._id;

  await Session.deleteMany({ user: userId });
  await User.deleteOne({ _id: userId });
  clearAuthCookies(res);
  res.status(204).end();
};

const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email }).select(
    "+emailVerificationHash +emailVerificationExpiresAt +emailVerificationAttempts",
  );
  const hasValidUser = user
    && !user.isEmailVerified
    && user.emailVerificationHash
    && user.emailVerificationExpiresAt >= new Date();

  if (!hasValidUser || user.emailVerificationAttempts >= MAX_EMAIL_VERIFICATION_ATTEMPTS) {
    throw new AppError(400, "رمز التحقق غير صحيح أو انتهت صلاحيته.", "INVALID_CODE");
  }

  user.emailVerificationAttempts += 1;
  const expectedCodeHash = Buffer.from(user.emailVerificationHash);
  const submittedCodeHash = Buffer.from(hashVerificationCode(code));
  const hashesMatch = expectedCodeHash.length === submittedCodeHash.length
    && crypto.timingSafeEqual(expectedCodeHash, submittedCodeHash);

  if (!hashesMatch) {
    if (user.emailVerificationAttempts >= MAX_EMAIL_VERIFICATION_ATTEMPTS) {
      user.emailVerificationHash = undefined;
    }

    await user.save();
    throw new AppError(400, "رمز التحقق غير صحيح أو انتهت صلاحيته.", "INVALID_CODE");
  }

  user.isEmailVerified = true;
  user.emailVerificationHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  user.emailVerificationAttempts = 0;
  await user.save();

  res.json({ message: "تم تأكيد البريد الإلكتروني بنجاح." });
};

const resendVerification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select(
    "+emailVerificationSentAt +emailVerificationHash +emailVerificationExpiresAt +emailVerificationAttempts",
  );

  if (user && !user.isEmailVerified) {
    const lastCodeSentAt = user.emailVerificationSentAt?.getTime() || 0;
    const cooldownHasPassed = Date.now() - lastCodeSentAt >= EMAIL_VERIFICATION_COOLDOWN_MS;

    if (!cooldownHasPassed) {
      throw new AppError(429, "يرجى الانتظار قبل طلب رمز جديد.", "RESEND_COOLDOWN");
    }

    const verificationCode = String(crypto.randomInt(100000, 1000000));
    user.emailVerificationHash = hashVerificationCode(verificationCode);
    user.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    user.emailVerificationAttempts = 0;
    user.emailVerificationSentAt = new Date();
    await user.save();

    await sendVerificationCode(user.email, verificationCode);
  }

  res.json({ message: "إذا كان الحساب بحاجة إلى التحقق، فسيتم إرسال رمز إليك." });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user && user.isActive) {
    const resetToken = createOpaqueToken();
    user.passwordResetHash = hashToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await user.save();

    await sendPasswordReset(user.email, resetToken);
  }

  res.json({ message: "إذا كان الحساب موجودًا، فستصلك تعليمات إعادة تعيين كلمة المرور." });
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const currentTime = new Date();
  const resetTokenHash = hashToken(token);
  const tokenIsValid = await User.exists({
    passwordResetHash: resetTokenHash,
    passwordResetExpiresAt: { $gt: currentTime },
  });

  if (!tokenIsValid) {
    throw new AppError(400, "رابط إعادة تعيين كلمة المرور غير صحيح أو انتهت صلاحيته.", "INVALID_RESET_TOKEN");
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.findOneAndUpdate(
    {
      passwordResetHash: resetTokenHash,
      passwordResetExpiresAt: { $gt: currentTime },
    },
    {
      $set: {
        password: hashedPassword,
        passwordChangedAt: currentTime,
      },
      $unset: {
        passwordResetHash: 1,
        passwordResetExpiresAt: 1,
      },
    },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new AppError(400, "رابط إعادة تعيين كلمة المرور غير صحيح أو انتهت صلاحيته.", "INVALID_RESET_TOKEN");
  }

  await revokeUserSessions(user._id);

  res.json({ message: "تم تغيير كلمة المرور. يرجى تسجيل الدخول مرة أخرى." });
};

const changePassword = async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, password } = req.body;
  const user = await User.findById(userId).select("+password");

  const isCurrentPasswordValid = await verify(user.password, currentPassword).catch(() => false);
  if (!isCurrentPasswordValid) {
    throw new AppError(400, "كلمة المرور الحالية غير صحيحة.", "INVALID_PASSWORD");
  }

  user.password = await hashPassword(password);
  user.passwordChangedAt = new Date();
  await user.save();

  await revokeUserSessions(user._id);
  clearAuthCookies(res);

  res.json({ message: "تم تغيير كلمة المرور. يرجى تسجيل الدخول مرة أخرى." });
};

const listSessions = async (req, res) => {
  const userId = req.user._id;
  const currentTime = new Date();
  const activeSessionsQuery = Session.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: currentTime },
  })
    .select("device ipAddress createdAt expiresAt")
    .sort({ createdAt: -1 });
  const sessions = await activeSessionsQuery;

  res.json({ sessions });
};

const revokeSession = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user._id;
  const currentTime = new Date();
  const revokeResult = await Session.updateOne(
    { _id: sessionId, user: userId, revokedAt: null },
    { $set: { revokedAt: currentTime } },
  );

  if (!revokeResult.modifiedCount) {
    throw new AppError(404, "لم يتم العثور على الجلسة.", "SESSION_NOT_FOUND");
  }

  res.status(204).end();
};

module.exports = {
  register,
  login,
  csrf,
  refresh,
  logout,
  logoutAll,
  me,
  deleteAccount,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  listSessions,
  revokeSession,
};
