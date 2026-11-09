const AUTH_COOKIE_PATH = "/api/auth";
const CSRF_COOKIE_PATH = "/api";
const REFRESH_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const createCookieOptions = (path, httpOnly = true) => ({
  httpOnly,
  secure: process.env.NODE_ENV === "production",
  // The Vercel frontend and Railway API use different sites in production.
  // Cross-site fetches need SameSite=None, which browsers require to be Secure.
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  path,
});

const clearLegacyCsrfCookie = (res) => {
  res.clearCookie(
    "csrfToken",
    createCookieOptions(AUTH_COOKIE_PATH, false),
  );
};

const setCsrfCookie = (res, csrfToken) => {
  clearLegacyCsrfCookie(res);
  const cookieOptions = {
    ...createCookieOptions(CSRF_COOKIE_PATH, false),
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };

  res.cookie("csrfToken", csrfToken, cookieOptions);
};

const setAuthCookies = (res, refreshToken, csrfToken) => {
  const refreshCookieOptions = {
    ...createCookieOptions(AUTH_COOKIE_PATH),
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };

  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  setCsrfCookie(res, csrfToken);
};

const clearAuthCookies = (res) => {
  res.clearCookie("refreshToken", createCookieOptions(AUTH_COOKIE_PATH));
  res.clearCookie("csrfToken", createCookieOptions(CSRF_COOKIE_PATH, false));
  clearLegacyCsrfCookie(res);
};

module.exports = {
  setCsrfCookie,
  setAuthCookies,
  clearAuthCookies,
};
