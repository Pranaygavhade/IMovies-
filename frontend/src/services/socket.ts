import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to live seat service:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from live seat service');
    });
  }
  return socket;
}

export function joinShowRoom(showId: string) {
  const s = getSocket();
  if (showId) {
    s.emit('join:show', showId);
  }
}

export function leaveShowRoom(showId: string) {
  const s = getSocket();
  if (showId) {
    s.emit('leave:show', showId);
  }
}
