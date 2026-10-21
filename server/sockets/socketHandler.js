const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a specific show room
    socket.on('join-show', (showId) => {
      const room = `show:${showId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // User leaves a show room
    socket.on('leave-show', (showId) => {
      const room = `show:${showId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Helper broadcaster functions
const broadcastSeatLocked = (showId, seats, userId, lockExpiresAt) => {
  if (io) {
    io.to(`show:${showId}`).emit('seat-locked', {
      showId,
      seats, // array of seat numbers
      lockedBy: userId,
      lockExpiresAt,
    });
  }
};

const broadcastSeatReleased = (showId, seats) => {
  if (io) {
    io.to(`show:${showId}`).emit('seat-released', {
      showId,
      seats, // array of seat numbers
    });
  }
};

const broadcastSeatBooked = (showId, seats) => {
  if (io) {
    io.to(`show:${showId}`).emit('seat-booked', {
      showId,
      seats, // array of seat numbers
    });
  }
};

module.exports = {
  initSocket,
  getIO,
  broadcastSeatLocked,
  broadcastSeatReleased,
  broadcastSeatBooked,
};
