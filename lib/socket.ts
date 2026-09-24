import { Server as SocketIOServer } from "socket.io";

/**
 * Helper to emit real-time Socket.IO events to specific rooms
 */
export function emitSocketEvent(room: string, event: string, payload: unknown): void {
  const io = (globalThis as unknown as { io?: SocketIOServer }).io;
  if (!io) {
    // In serverless, build time, or if socket server not attached yet
    return;
  }
  io.to(room).emit(event, payload);
}

/**
 * Emit to user room (e.g. notifications, personal task updates)
 */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  emitSocketEvent(`user:${userId}`, event, payload);
}

/**
 * Emit to channel room (e.g. chat messages, reactions)
 */
export function emitToChannel(channelId: string, event: string, payload: unknown): void {
  emitSocketEvent(`channel:${channelId}`, event, payload);
}

/**
 * Emit to team room (e.g. team board changes)
 */
export function emitToTeam(teamId: string, event: string, payload: unknown): void {
  emitSocketEvent(`team:${teamId}`, event, payload);
}
