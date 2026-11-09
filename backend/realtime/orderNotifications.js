const jwt = require("jsonwebtoken");
const { WebSocket, WebSocketServer } = require("ws");
const User = require("../models/User");

const WS_PATH = "/ws/admin/orders";
const AUTH_TIMEOUT_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 30000;
const JWT_OPTIONS = { issuer: "eco-api", audience: "eco-client" };
let broadcastNewOrder = () => {};

const configuredOrigins = () => (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const rejectUpgrade = (socket, status) => {
  socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
};

const attachOrderNotifications = (httpServer) => {
  const webSocketServer = new WebSocketServer({
    noServer: true,
    maxPayload: 2048,
    perMessageDeflate: false,
  });

  const handleUpgrade = (request, socket, head) => {
    let pathname;
    try {
      pathname = new URL(request.url, "http://localhost").pathname;
    } catch {
      rejectUpgrade(socket, "400 Bad Request");
      return;
    }
    if (pathname !== WS_PATH) {
      rejectUpgrade(socket, "404 Not Found");
      return;
    }

    const origin = request.headers.origin;
    if (origin && !configuredOrigins().includes(origin)) {
      rejectUpgrade(socket, "403 Forbidden");
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (client) => {
      webSocketServer.emit("connection", client, request);
    });
  };

  httpServer.on("upgrade", handleUpgrade);

  webSocketServer.on("connection", (client) => {
    client.isAlive = true;
    client.isAdministrator = false;
    const authenticationTimeout = setTimeout(() => client.close(4401, "Authentication required"), AUTH_TIMEOUT_MS);
    authenticationTimeout.unref?.();
    client.on("pong", () => { client.isAlive = true; });

    client.on("message", async (data, isBinary) => {
      if (client.isAdministrator || isBinary) {
        client.close(1008, "Unexpected message");
        return;
      }

      let message;
      try {
        message = JSON.parse(data.toString());
      } catch {
        client.close(1008, "Invalid authentication message");
        return;
      }
      if (message.type !== "authenticate" || typeof message.token !== "string" || message.token.length > 4096) {
        client.close(1008, "Invalid authentication message");
        return;
      }

      try {
        const payload = jwt.verify(message.token, process.env.ACCESS_TOKEN_SECRET, JWT_OPTIONS);
        const administrator = await User.findOne({ _id: payload.sub, isActive: true, role: "admin" }).select("_id passwordChangedAt").lean();
        if (!administrator) {
          client.close(4403, "Administrator access required");
          return;
        }
        if (administrator.passwordChangedAt && payload.iat * 1000 < administrator.passwordChangedAt.getTime()) {
          client.close(4401, "Authentication expired");
          return;
        }
        clearTimeout(authenticationTimeout);
        client.isAdministrator = true;
        client.send(JSON.stringify({ type: "ready" }));
      } catch {
        client.close(4401, "Authentication failed");
      }
    });

    client.on("close", () => clearTimeout(authenticationTimeout));
    client.on("error", () => {});
  });

  const heartbeat = setInterval(() => {
    for (const client of webSocketServer.clients) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);
  heartbeat.unref?.();

  const realtime = {
    publishNewOrder(order) {
      const event = JSON.stringify({
        type: "new_order",
        order: {
          id: String(order._id),
          code: String(order._id).slice(-8).toUpperCase(),
          customerName: order.customer.name,
          total: order.total,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          createdAt: order.createdAt,
        },
      });
      for (const client of webSocketServer.clients) {
        if (client.isAdministrator && client.readyState === WebSocket.OPEN) client.send(event);
      }
    },
    close() {
      clearInterval(heartbeat);
      httpServer.off("upgrade", handleUpgrade);
      for (const client of webSocketServer.clients) client.terminate();
      webSocketServer.close();
    },
  };
  broadcastNewOrder = realtime.publishNewOrder;
  return realtime;
};

module.exports = attachOrderNotifications;
module.exports.publishNewOrder = (order) => broadcastNewOrder(order);
