const AUTH_COOKIE_PATH = "/api/auth";
const REFRESH_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const createAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: AUTH_COOKIE_PATH,
});

const setAuthCookies = (res, refreshToken, csrfToken) => {
  const sharedOptions = createAuthCookieOptions();
  const refreshCookieOptions = {
    ...sharedOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
  const csrfCookieOptions = {
    ...sharedOptions,
    httpOnly: false,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };

  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.cookie("csrfToken", csrfToken, csrfCookieOptions);
};

const clearAuthCookies = (res) => {
  const sharedOptions = createAuthCookieOptions();

  res.clearCookie("refreshToken", sharedOptions);
  res.clearCookie("csrfToken", {
    ...sharedOptions,
    httpOnly: false,
  });
};

module.exports = {
  setAuthCookies,
  clearAuthCookies,
};
