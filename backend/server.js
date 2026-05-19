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
const eventRoutes = require('./routes/eventRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const Message = require('./models/Message');

const cookieParser = require('cookie-parser');
const { connection } = require('mongoose');

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const isLocal = origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
      if (!origin || allowedOrigins.includes(origin) || isLocal) {
        console.log(`[Socket.IO CORS] ✓ Origin дозволений: ${origin}`);
        callback(null, true);
      } else {
        console.log('[Socket.IO CORS] ✗ Origin відхилен:', origin);
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  },
  transports: ['websocket', 'polling']
})

// Логуємо ВСЕ в io
console.log(`[Socket.IO] Інітиалізація з портом: ${PORT}`);
io.engine.on('connection_error', (err) => {
  console.error('[Socket.IO Engine Error]:', err.message);
});

connectDB();

// Security and Middleware
app.use(cookieParser());

// CORS Configuration - restrict to frontend origin
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

// Basic rate limiting - disabled for localhost
const requestCounts = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip;
  
  // Skip rate limiting for localhost
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1' || ip?.includes('127.0.0')) {
    return next();
  }
  
  const now = Date.now();
  const windowSize = 60000; // 1 minute
  const maxRequests = 1000;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip).filter(t => now - t < windowSize);

  if (timestamps.length >= maxRequests) {
    return res.status(429).json({ message: 'Забагато запитів, спробуйте ще раз пізніше' });
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
app.use('/api/events', eventRoutes);

app.use(errorHandler);

console.log(`[Socket.IO Engine] Слухаємо на порту ${PORT}...`);

io.engine.on('initial_headers', (headers, req) => {
  console.log(`[Socket.IO] 📨 Початковий запит від:`, req.headers.origin);
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] ✓ Новий клієнт підключився: ${socket.id}`);
  console.log(`[Socket.IO] Всього клієнтів: ${io.engine.clientsCount}`);

  // Log all events for debugging
  socket.onAny((eventName, ...args) => {
    console.log(`[Socket Event] ${eventName}:`, args[0]);
  });

  socket.on('error', (error) => {
    console.error(`[Socket Error] ${socket.id}:`, error);
  });

  socket.on('join-chat', async (data) => {
    const { userId, chatPartnerId, groupId } = data;
    console.log(`[join-chat] Отримано:`, { userId, chatPartnerId, groupId });
    
    const safeUserId = userId ? String(userId) : '';
    const safePartnerId = chatPartnerId ? String(chatPartnerId) : '';
    const roomId = groupId ? String(groupId) : [safeUserId, safePartnerId].sort().join('-');
    
    try {
      socket.join(roomId);
      socket.userId = userId;
      socket.roomId = roomId;
      
      console.log(`[join-chat] ✓ Юзер ${userId} приєднався до кімнати: ${roomId}`);
      
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const onlineUsersInRoom = socketsInRoom.map(s => s.userId).filter(id => id && id !== userId);
      
      console.log(`[join-chat] В кімнаті ${roomId} тепер ${socketsInRoom.length} сокетів, активних юзерів: ${onlineUsersInRoom.length}`);
      
      socket.emit('room-users', { users: onlineUsersInRoom });
      socket.to(roomId).emit('user-online', { userId });
    } catch (err) {
      console.error('[join-chat] ✗ Помилка:', err.message);
      console.error('[join-chat] Stack:', err.stack);
    }
  });

  socket.on('send-message', async (data) => {
    console.log(`[send-message] Отримано подію`, { 
      socketId: socket.id,
      hasData: !!data,
      keys: data ? Object.keys(data) : []
    });
    
    try {
      const { senderId, receiverId, groupId, text, imageUrl, senderInfo } = data;
      const safeSenderId = senderId ? String(senderId) : '';
      const safeReceiverId = receiverId ? String(receiverId) : '';
      const roomId = groupId ? String(groupId) : [safeSenderId, safeReceiverId].sort().join('-');
      
      console.log(`[send-message] Параметри:`, {
        senderId,
        receiverId,
        groupId,
        text: text?.substring(0, 50),
        roomId,
        socketId: socket.id
      });

      const newMessage = await Message.create({
        senderId,
        receiverId: receiverId || undefined,
        groupId: groupId || undefined,
        text,
        imageUrl
      });

      console.log(`[send-message] ✓ Повідомлення збережено в БД:`, newMessage._id);

      const messageData = {
        senderId: senderInfo || senderId,
        receiverId,
        groupId,
        text,
        imageUrl,
        createdAt: new Date(),
        _id: newMessage._id
      };

      console.log(`[send-message] Розсилаємо в кімнату ${roomId}...`);

      io.to(roomId).emit('new-message', messageData);
      
      console.log(`[send-message] ✓ Повідомлення надіслано в кімнату ${roomId}`);
    } catch (err) {
      console.error('[send-message] ✗ ПОМИЛКА:', err.message);
      console.error('[send-message] Stack:', err.stack);
    }
  });

  socket.on('leave-chat', (data) => {
    const { userId, chatPartnerId, groupId } = data;
    const safeUserId = userId ? String(userId) : '';
    const safePartnerId = chatPartnerId ? String(chatPartnerId) : '';
    const roomId = groupId ? String(groupId) : [safeUserId, safePartnerId].sort().join('-');
    socket.leave(roomId);
    console.log(`${userId} покинув кімнату: ${roomId}`);
    socket.to(roomId).emit('user-offline', { userId });
  });

  socket.on('typing', (data) => {
    const { userId, chatPartnerId, groupId } = data;
    const safeUserId = userId ? String(userId) : '';
    const safePartnerId = chatPartnerId ? String(chatPartnerId) : '';
    const roomId = groupId ? String(groupId) : [safeUserId, safePartnerId].sort().join('-');
    socket.to(roomId).emit('user-typing', { userId });
  })

  socket.on('stop-typing', (data) => {
    const { userId, chatPartnerId, groupId } = data;
    const safeUserId = userId ? String(userId) : '';
    const safePartnerId = chatPartnerId ? String(chatPartnerId) : '';
    const roomId = groupId ? String(groupId) : [safeUserId, safePartnerId].sort().join('-');
    socket.to(roomId).emit('user-stop-typing', { userId });
  })

  socket.on('delete-message', (data) => {
    const { messageId, roomId } = data;
    socket.to(roomId).emit('message-deleted', { messageId });
  });

  socket.on('edit-message', (data) => {
    const { messageId, roomId, text } = data;
    socket.to(roomId).emit('message-edited', { messageId, text });
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ✗ Клієнт ${socket.id} розійдався. Був в кімнаті: ${socket.roomId}, юзер: ${socket.userId}`);
    if (socket.roomId && socket.userId) {
      socket.to(socket.roomId).emit('user-offline', { userId: socket.userId });
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});