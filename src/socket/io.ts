import { createAdapter } from "@socket.io/redis-adapter";
import type { Server } from "socket.io";
import { createRedisDuplicate } from "../config/redis.client";

let _io: Server | null = null;

export async function configureSocketAdapter(io: Server) {
  const pubClient = createRedisDuplicate();
  const subClient = createRedisDuplicate();
  if (!pubClient || !subClient) {
    return;
  }
  io.adapter(createAdapter(pubClient, subClient));
}

export function setIO(io: Server) {
  _io = io;
}

export function getIO(): Server | null {
  return _io;
}
