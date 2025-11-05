import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;
export { io };

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    transports: ['websocket', 'polling']
  });

  // Authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('No auth token provided for socket connection');
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      console.log('Socket authenticated for user:', decoded.userId);
      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a room specific to this user
    socket.join(`user:${socket.userId}`);

    socket.on('markAsRead', async ({ requestIds }) => {
      try {
        const SwapRequest = (await import('./models/SwapRequest.js')).default;
        await SwapRequest.updateMany(
          { 
            _id: { $in: requestIds },
            respondingUserId: socket.userId
          },
          { readByRespondingUser: true }
        );
      } catch (err) {
        console.error('Error marking requests as read:', err);
      }
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${socket.userId}`);
    });
  });
};

export const notifyUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};