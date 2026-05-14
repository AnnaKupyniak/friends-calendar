const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: './config/.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io')
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const Message = require('./models/Message');

const cookieParser = require('cookie-parser');
const { connection } = require('mongoose');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const isLocal = origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
      if (!origin || isLocal) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }
})
const PORT = process.env.PORT || 5000;

connectDB();

// Security and Middleware
app.use(cookieParser());

// CORS Configuration - restrict to frontend origin
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    const isLocal = origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
    if (!origin || allowedOrigins.includes(origin) || isLocal) {
      callback(null, true);
    } else {
      console.log('Rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic rate limiting
const requestCounts = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowSize = 60000; // 1 minute
  const maxRequests = 1000;  // Збільшено з 100 на 1000

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip).filter(t => now - t < windowSize);

  if (timestamps.length >= maxRequests) {
    return res.status(429).json({ message: 'Too many requests, please try again later' });
  }

  timestamps.push(now);
  requestCounts.set(ip, timestamps);
  next();
};

app.use(rateLimit);

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

app.use(securityHeaders);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log(`Новий юзер: ${socket.id}`);

  socket.on('join-chat', (data) => {
    const { userId, chatPartnerId } = data;
    const roomId = [userId, chatPartnerId].sort().join('-');
    socket.join(roomId);
    console.log(`${userId} приєднався до кімнати: ${roomId}`);
    io.to(roomId).emit('user-online', { userId });
  })

  socket.on('send-message', async (data) => {
    const { senderId, receiverId, text } = data;
    const roomId = [senderId, receiverId].sort().join('-');
    try {
      const newMessage = await Message.create({
        senderId: senderId,
        receiverId: receiverId,
        text,
      })

      io.to(roomId).emit('new-message', {
        senderId: senderId,
        receiverId: receiverId,
        text,
        timestamp: new Date(),
        _id: newMessage._id
      })
      console.log(`Повідомлення від ${senderId} збережено`);
    } catch (err) {
      console.error('Помилка при збереженні:', err);
    }
  });

  socket.on('typing', (data) => {
    const { userId, chatPartnerId } = data;
    const roomId = [userId, chatPartnerId].sort().join('-')
    socket.to(roomId).emit('user-typing', { userId });
  })

  socket.on('stop-typing', (data) => {
    const { userId, chatPartnerId } = data;
    const roomId = [userId, chatPartnerId].sort().join('-')
    socket.to(roomId).emit('user-stop-typing', { userId });
  })
  socket.on('disconnect', () => {
    console.log(`Клієнт відключився: ${socket.id}`)
  })
})

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});