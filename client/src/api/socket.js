import { io } from 'socket.io-client';

let socket = null;

// Connects to same origin dynamically (no hardcoded URL needed)
export const getSocket = () => {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to IMovies Realtime Engine:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket Connection Warning]:', err.message);
    });
  }
  return socket;
};

export const joinShowRoom = (showId) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join-show', showId);
  } else if (s) {
    s.once('connect', () => s.emit('join-show', showId));
  }
};

export const leaveShowRoom = (showId) => {
  const s = getSocket();
  if (s) {
    s.emit('leave-show', showId);
  }
};
