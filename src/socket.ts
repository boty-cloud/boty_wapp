import type { Server } from "socket.io";

let io: Server;

export function setIO(instance: Server): void {
  io = instance;
}

export function getIO(): Server {
  return io;
}
