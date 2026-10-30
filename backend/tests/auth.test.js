const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

jest.mock("../utils/email", () => ({
  sendVerificationCode: jest.fn(),
  sendPasswordReset: jest.fn(),
}));

const email = require("../utils/email");

process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET = "a".repeat(48);
process.env.REFRESH_TOKEN_SECRET = "b".repeat(48);
process.env.COOKIE_SECRET = "c".repeat(48);
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.REFRESH_TOKEN_EXPIRES_IN = "14d";
process.env.ACCESS_TOKEN_EXPIRES_IN = "15m";

let mongo;
let app;
let User;
let Session;

const password = "CorrectHorseBattery12!";
const csrfAgent = async () => {
  const agent = request.agent(app);
  const response = await agent.get("/api/auth/csrf");
  return { agent, csrfToken: response.body.csrfToken };
};

const registerUser = async (agent, csrfToken, overrides = {}) => agent
  .post("/api/auth/register")
  .set("x-csrf-token", csrfToken)
  .send({ firstName: "Test", lastName: "User", email: "test@example.com", password, ...overrides });

const verifyRegisteredUser = async (agent, csrfToken, targetEmail = "test@example.com") => {
  const code = email.sendVerificationCode.mock.calls.at(-1)[1];
  return agent.post("/api/auth/verify-email").set("x-csrf-token", csrfToken).send({ email: targetEmail, code });
};

const loginUser = async (agent, csrfToken, targetEmail = "test@example.com") => agent
  .post("/api/auth/login")
  .set("x-csrf-token", csrfToken)
  .send({ email: targetEmail, password });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  User = require("../models/User");
  Session = require("../models/Session");
  await Promise.all([User.init(), Session.init()]);
  app = require("../app");
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
  email.sendVerificationCode.mockClear();
  email.sendPasswordReset.mockClear();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("authentication security", () => {
  test("registers users with a hashed password and ignores client-supplied roles", async () => {
    const { agent, csrfToken } = await csrfAgent();
    const response = await registerUser(agent, csrfToken, { role: "admin" });
    expect(response.status).toBe(201);
    const user = await User.findOne({ email: "test@example.com" }).select("+password");
    expect(user.role).toBe("user");
    expect(user.password).not.toBe(password);
    expect(await argon2.verify(user.password, password)).toBe(true);
  });

  test("rejects duplicate email registration", async () => {
    const { agent, csrfToken } = await csrfAgent();
    await registerUser(agent, csrfToken);
    const response = await registerUser(agent, csrfToken);
    expect(response.status).toBe(409);
  });

  test("requires a valid email verification code and blocks expired codes", async () => {
    const { agent, csrfToken } = await csrfAgent();
    await registerUser(agent, csrfToken);
    await User.updateOne({ email: "test@example.com" }, { $set: { emailVerificationExpiresAt: new Date(Date.now() - 1000) } });
    const response = await verifyRegisteredUser(agent, csrfToken);
    expect(response.status).toBe(400);
    expect((await User.findOne({ email: "test@example.com" })).isEmailVerified).toBe(false);
  });

  test("rejects invalid login credentials with the same generic response", async () => {
    const { agent, csrfToken } = await csrfAgent();
    const response = await loginUser(agent, csrfToken, "missing@example.com");
    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe("Invalid email or password");
  });

  test("issues an access token, supports me, and rotates refresh tokens", async () => {
    const { agent, csrfToken } = await csrfAgent();
    await registerUser(agent, csrfToken);
    await verifyRegisteredUser(agent, csrfToken);
    const login = await loginUser(agent, csrfToken);
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
    const oldRefreshCookie = login.headers["set-cookie"].find((value) => value.startsWith("refreshToken=")).split(";")[0];
    const me = await agent.get("/api/auth/me").set("authorization", `Bearer ${login.body.accessToken}`);
    expect(me.body.user.email).toBe("test@example.com");
    const refreshed = await agent.post("/api/auth/refresh").set("x-csrf-token", login.body.csrfToken);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeTruthy();
    const replay = await request(app).post("/api/auth/refresh")
      .set("Cookie", `${oldRefreshCookie}; csrfToken=${refreshed.body.csrfToken}`)
      .set("x-csrf-token", refreshed.body.csrfToken);
    expect(replay.status).toBe(401);
    expect((await Session.find()).every((session) => session.revokedAt)).toBe(true);
  });

  test("rejects expired access tokens", async () => {
    const { agent } = await csrfAgent();
    const user = await User.create({ name: "Expired User", email: "expired@example.com", password: await argon2.hash(password), isEmailVerified: true });
    const token = jwt.sign({ sub: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -1, issuer: "eco-api", audience: "eco-client" });
    const response = await agent.get("/api/auth/me").set("authorization", `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  test("requires a valid CSRF token for cookie-authenticated mutations", async () => {
    const response = await request(app).post("/api/auth/logout");
    expect(response.status).toBe(403);
  });

  test("revokes a session on logout", async () => {
    const { agent, csrfToken } = await csrfAgent();
    await registerUser(agent, csrfToken);
    await verifyRegisteredUser(agent, csrfToken);
    const login = await loginUser(agent, csrfToken);
    const response = await agent.post("/api/auth/logout").set("x-csrf-token", login.body.csrfToken);
    expect(response.status).toBe(204);
    expect((await Session.findOne()).revokedAt).toBeTruthy();
  });

  test("returns generic forgot-password results and rejects expired reset tokens", async () => {
    const { agent, csrfToken } = await csrfAgent();
    const user = await User.create({ name: "Reset User", email: "reset@example.com", password: await argon2.hash(password), isEmailVerified: true });
    const token = "d".repeat(64);
    user.passwordResetHash = require("../utils/tokens").hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() - 1000);
    await user.save();
    const forgot = await agent.post("/api/auth/forgot-password").set("x-csrf-token", csrfToken).send({ email: "unknown@example.com" });
    expect(forgot.status).toBe(200);
    const reset = await agent.post("/api/auth/reset-password").set("x-csrf-token", csrfToken).send({ token, password: "AnotherCorrectPassword123!" });
    expect(reset.status).toBe(400);
  });

  test("prevents user access to admin routes and permits DB-authorized admins", async () => {
    const userAgent = await csrfAgent();
    await registerUser(userAgent.agent, userAgent.csrfToken);
    await verifyRegisteredUser(userAgent.agent, userAgent.csrfToken);
    const userLogin = await loginUser(userAgent.agent, userAgent.csrfToken);
    const denied = await userAgent.agent.get("/api/admin/users").set("authorization", `Bearer ${userLogin.body.accessToken}`);
    expect(denied.status).toBe(403);

    await User.create({ name: "Admin", email: "admin@example.com", password: await argon2.hash(password), role: "admin", isEmailVerified: true });
    const adminAgent = await csrfAgent();
    const adminLogin = await loginUser(adminAgent.agent, adminAgent.csrfToken, "admin@example.com");
    const allowed = await adminAgent.agent.get("/api/admin/users").set("authorization", `Bearer ${adminLogin.body.accessToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.users).toBeInstanceOf(Array);
  });

  test("enforces the login rate limit", async () => {
    const { agent, csrfToken } = await csrfAgent();
    const responses = [];
    for (let index = 0; index < 9; index += 1) responses.push(await loginUser(agent, csrfToken, "limited@example.com"));
    expect(responses.at(-1).status).toBe(429);
  });
});
