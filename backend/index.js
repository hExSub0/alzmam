require("dotenv").config();
const app = require("./app");
const connectDB = require("./db/connectDB");
const mongoose = require("mongoose");
const attachOrderNotifications = require("./realtime/orderNotifications");

const REQUIRED_SECRET_NAMES = [
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "COOKIE_SECRET",
];
const MINIMUM_SECRET_LENGTH_BYTES = 32;
const DEFAULT_PORT = 4000;

const validateEnvironment = () => {
  for (const secretName of REQUIRED_SECRET_NAMES) {
    const secretValue = process.env[secretName];
    const secretLength = Buffer.byteLength(secretValue || "");
    const secretIsTooShort = secretLength < MINIMUM_SECRET_LENGTH_BYTES;

    if (secretIsTooShort) {
      throw new Error(`${secretName} must contain at least 32 bytes`);
    }
  }

  const secretsAreReused = process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET;
  if (secretsAreReused) {
    throw new Error("Access and refresh token secrets must be different");
  }

  const requiredConfiguration = ["MONGO_URI", "EMAIL_FROM", "PASSWORD_RESET_URL"];
  for (const configurationName of requiredConfiguration) {
    if (!process.env[configurationName]) {
      throw new Error(`${configurationName} is required`);
    }
  }
};

const startServer = async () => {
  validateEnvironment();
  await connectDB();

  const port = Number(process.env.PORT || DEFAULT_PORT);
  const httpServer = app.listen(port, () => {
    console.log(`ECO API listening on port ${port}`);
  });
  server = httpServer;
  server.orderNotifications = attachOrderNotifications(httpServer);
  return httpServer;
};

let server;

const shutdown = async () => {
  if (server) {
    server.orderNotifications?.close();
    await new Promise((resolve) => server.close(resolve));
  }

  await mongoose.disconnect();
};

const handleShutdownSignal = () => {
  shutdown()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
};

process.once("SIGINT", handleShutdownSignal);
process.once("SIGTERM", handleShutdownSignal);

startServer()
  .then((httpServer) => {
    server = httpServer;
  })
  .catch((error) => {
    const errorLog = {
      event: "server_start_failed",
      name: error.name || "Error",
    };

    console.error(JSON.stringify(errorLog));
    process.exitCode = 1;
  });
