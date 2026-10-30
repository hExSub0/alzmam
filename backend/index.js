require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const requiredSecrets = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET", "COOKIE_SECRET"];
for (const name of requiredSecrets) {
  if (!process.env[name] || Buffer.byteLength(process.env[name]) < 32) {
    throw new Error(`${name} must contain at least 32 bytes`);
  }
}
if (process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("Access and refresh token secrets must be different");
}
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM is required");
if (!process.env.PASSWORD_RESET_URL) throw new Error("PASSWORD_RESET_URL is required");

const port = Number(process.env.PORT || 4000);
let server;

const shutdown = async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
};

process.once("SIGINT", () => shutdown().finally(() => process.exit(0)));
process.once("SIGTERM", () => shutdown().finally(() => process.exit(0)));

mongoose.connect(process.env.MONGO_URI, { autoIndex: process.env.NODE_ENV !== "production" })
  .then(() => {
    server = app.listen(port, () => console.log(`ECO API listening on port ${port}`));
  })
  .catch((error) => {
    console.error(JSON.stringify({ event: "database_connection_failed", name: error.name }));
    process.exitCode = 1;
  });
