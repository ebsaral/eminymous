import express, { Express, Request, Response } from "express";
import * as socketio from "socket.io";

const app: Express = express();
export const io: socketio.Server = new socketio.Server();

io.on("connection", (socket: socketio.Socket) => {
  console.log("connection");
  socket.emit("status", "Hello from Socket.io");

  socket.on("disconnect", () => {
    console.log("client disconnected");
  });
});

app.get("/hello", async (_: Request, res: Response) => {
  res.send("Hello World");
});

export default app;
