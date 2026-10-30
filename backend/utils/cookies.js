const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
});

const setAuthCookies = (res, refreshToken, csrfToken) => {
  const base = cookieOptions();
  const maxAge = 14 * 24 * 60 * 60 * 1000;
  res.cookie("refreshToken", refreshToken, { ...base, maxAge });
  res.cookie("csrfToken", csrfToken, { ...base, httpOnly: false, maxAge });
};

const clearAuthCookies = (res) => {
  const base = cookieOptions();
  res.clearCookie("refreshToken", base);
  res.clearCookie("csrfToken", { ...base, httpOnly: false });
};

module.exports = { setAuthCookies, clearAuthCookies };
