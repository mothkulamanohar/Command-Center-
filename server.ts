import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const isProd = process.env.NODE_ENV === "production" || process.argv.includes("--prod") || process.env.PROD === "1";
if (!isProd && !process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = "development";
}
const dev = !isProd;
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Global reference for emitting socket events from service layers
declare global {
  var io: SocketIOServer | undefined;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  globalThis.io = io;

  io.on("connection", (socket) => {
    // Room joining logic: user:{id}, channel:{id}, team:{id}
    socket.on("join", (room: string) => {
      if (
        room.startsWith("user:") ||
        room.startsWith("channel:") ||
        room.startsWith("team:")
      ) {
        socket.join(room);
      }
    });

    socket.on("leave", (room: string) => {
      socket.leave(room);
    });

    socket.on("typing", (data: { channelId: string; userId: string; isTyping: boolean }) => {
      socket.to(`channel:${data.channelId}`).emit("typing", data);
    });

    socket.on("disconnect", () => {
      // presence handling placeholder
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Command Center ready on http://${hostname}:${port}`);
  });
});
