const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const createAuthenticationRequiredError = () => new AppError(
  401,
  "Authentication required",
  "AUTH_REQUIRED",
);
const ACCESS_TOKEN_OPTIONS = {
  issuer: "eco-api",
  audience: "eco-client",
};

const authenticateUser = async (req, _res, next) => {
  const authorizationHeader = req.get("authorization") || "";
  const [authorizationScheme, accessToken] = authorizationHeader.split(" ");
  const hasBearerToken = authorizationScheme === "Bearer" && Boolean(accessToken);

  if (!hasBearerToken) {
    return next(createAuthenticationRequiredError());
  }

  let tokenPayload;
  try {
    tokenPayload = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      ACCESS_TOKEN_OPTIONS,
    );
  } catch {
    return next(createAuthenticationRequiredError());
  }

  const userId = tokenPayload.sub;
  const user = await User.findOne({
    _id: userId,
    isActive: true,
  });
  const passwordWasChangedAfterTokenIssue = user?.passwordChangedAt
    && tokenPayload.iat * 1000 < user.passwordChangedAt.getTime();

  if (!user || passwordWasChangedAfterTokenIssue) {
    return next(createAuthenticationRequiredError());
  }

  req.user = user;
  return next();
};

module.exports = authenticateUser;
