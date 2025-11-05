import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import swapRoutes from './routes/swaps.js';
import { initializeSocket } from './socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
initializeSocket(httpServer);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/swaps', swapRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
