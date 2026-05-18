# Friends Calendar - Real-time Chat Application

## 📌 Опис проекту

**Friends Calendar** - це веб-застосунок для спілкування та управління подіями з друзями. Основна фіча - **real-time чат на базі Socket.IO**, який забезпечує миттєву доставку повідомлень між користувачами.

### Ключові особливості:
- ✅ Real-time двосторонній чат через Socket.IO
- ✅ Управління друзями та групами
- ✅ Спільний календар подій
- ✅ Система повідомлень
- ✅ Завантаження аватарів
- ✅ JWT автентифікація

---

## 🏗️ Архітектура

### Стек технологій:

**Frontend:**
- React 18+
- Vite (bundler)
- React Router (навігація)
- Socket.IO Client (WebSocket)
- Axios (HTTP запити)

**Backend:**
- Node.js + Express
- Socket.IO (real-time)
- MongoDB (база даних)
- Mongoose (ODM)
- JWT (автентифікація)

### Структура проекту:

```
friends-calendar/
├── frontend/              # React додаток
│   ├── src/
│   │   ├── pages/        # Сторінки (Login, Chat, Profile)
│   │   ├── components/   # Компоненти (Header, Modal, Button)
│   │   ├── features/     # Ознаки (Friends, Memories, Categories)
│   │   ├── context/      # React Context (Auth, Friends, Memories)
│   │   └── api/          # API конфіг (Axios)
│   └── package.json
│
└── backend/              # Node.js сервер
    ├── controllers/      # Бізнес логіка
    ├── routes/          # API маршрути
    ├── models/          # MongoDB моделі
    ├── middleware/      # Auth, validation, upload
    ├── config/          # Конфігурація
    ├── server.js        # Головний файл з Socket.IO
    └── package.json
```

---

## 💬 Real-time Chat на базі Socket.IO

### 1️⃣ Backend (server.js)

Socket.IO сервер прослуховує 5 основних подій:

#### **Приєднання до кімнати**
```javascript
socket.on('join-chat', (data) => {
  const { userId, chatPartnerId } = data;
  const roomId = [userId, chatPartnerId].sort().join('-');
  socket.join(roomId);
  console.log(`${userId} приєднався до кімнати: ${roomId}`);
});
```

**Кімната** - це унікальна пара користувачів. ID складається з двох userId, відсортованих для консистентності.

#### **Отримання та відправка повідомлення**
```javascript
socket.on('send-message', async (data) => {
  const { senderId, receiverId, text } = data;
  const roomId = [senderId, receiverId].sort().join('-');
  
  try {
    // 💾 Зберігаємо в БД
    const newMessage = await Message.create({
      senderId: senderId,
      receiverId: receiverId,
      text,
    });

    // 📤 Розсилаємо повідомлення всім в кімнаті
    io.to(roomId).emit('new-message', {
      _id: newMessage._id,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      text: newMessage.text,
      createdAt: newMessage.createdAt,
    });
  } catch (err) {
    console.error('Помилка при збереженні:', err);
  }
});
```

**Основна логіка:**
1. Отримуємо дані з frontend
2. Зберігаємо в MongoDB
3. Розсилаємо в кімнату (обом користувачам)

#### **Typing indicator**
```javascript
socket.on('typing', (data) => {
  const { userId, chatPartnerId } = data;
  const roomId = [userId, chatPartnerId].sort().join('-');
  socket.to(roomId).emit('user-typing', { userId });
});

socket.on('stop-typing', (data) => {
  const { userId, chatPartnerId } = data;
  const roomId = [userId, chatPartnerId].sort().join('-');
  socket.to(roomId).emit('user-stop-typing', { userId });
});
```

#### **Відключення**
```javascript
socket.on('disconnect', () => {
  console.log(`Клієнт відключився: ${socket.id}`);
});
```

---

### 2️⃣ Frontend (Chat.jsx)

#### **Підключення та слухання подій**

```javascript
useEffect(() => {
  // Підключаємось до backend на порту 5000
  socket.current = io('http://localhost:5000', {
    reconnection: true,
  });

  // Приєднуємось до кімнати з конкретним користувачем
  socket.current.emit('join-chat', {
    userId: user._id,
    chatPartnerId: id,  // ID з URL параметра
  });

  // Завантажуємо старі повідомлення з БД
  fetchMessages();

  // 👂 Слухаємо нові повідомлення в реальному часі
  socket.current.on('new-message', (message) => {
    setMessages((prev) => [...prev, message]);
    scrollToBottom();
  });

  // 👂 Слухаємо що користувач онлайн
  socket.current.on('user-online', (data) => {
    console.log(`${data.userId} онлайн`);
  });

  return () => {
    socket.current?.off('new-message');
    socket.current?.off('user-online');
  };
}, [user._id, id]);
```

**Ключова особливість:** коли змінюється `id` (переходимо на іншого користувача), useEffect повторно запускається та перепідключає Socket до нової кімнати!

#### **Відправка повідомлення**

```javascript
function sendMessage() {
  if (!text.trim()) return;
  
  // 📤 Відправляємо через Socket
  socket.current.emit('send-message', {
    senderId: user._id,
    receiverId: id,
    text,
  });
  
  setText('');  // Очищуємо поле
}
```

---

## 🎯 Типові помилки та їх рішення

### ❌ Помилка 1: Неправильні назви полів

**Проблема:**
```javascript
// Backend відправляє "sender"
emit('new-message', { sender: senderId, ... })

// Frontend очікує "senderId"
const isMine = msg.senderId === user._id;  // undefined!
```

**Рішення:** Використовувати **однакові назви полів**!

```javascript
// Backend
emit('new-message', { senderId, receiverId, text, ... })

// Frontend
const isMine = msg.senderId === user._id;  // ✅ працює
```

### ❌ Помилка 2: Забули `async`

```javascript
// ❌ Неправильно
socket.on('send-message', (data) => {
  const msg = await Message.create(data);  // ❌ Syntax error!
});

// ✅ Правильно
socket.on('send-message', async (data) => {
  const msg = await Message.create(data);  // ✅ OK
});
```

### ❌ Помилка 3: Socket підключається до неправильного порту

```javascript
// ❌ Неправильно - це frontend port
socket.current = io('http://localhost:5173');

// ✅ Правильно - це backend port
socket.current = io('http://localhost:5000');
```

### ❌ Помилка 4: EADDRINUSE - port зайнятий

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Рішення:**
```bash
# Вбити всі Node процеси
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

---

## 🚀 Запуск проекту

### 1. Встановити залежності

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Налаштування环境

**Backend** - створити `.env` файл:
```env
MONGO_URI=mongodb://localhost:27017/friends-calendar
PORT=5000
JWT_SECRET=your_secret_key
```

### 3. Запустити

**Backend (в одному терміналі):**
```bash
cd backend
npm start
# Server is running on http://localhost:5000
```

**Frontend (в іншому терміналі):**
```bash
cd frontend
npm run dev
# Frontend: http://localhost:5173
```

### 4. Тестування

1. Відкрити `http://localhost:5173` в браузері
2. Залогуватися
3. Обрати друга в чаті
4. Писати повідомлення - вони з'являються миттєво! ⚡

---

## 📊 MongoDB моделі

### Message Schema
```javascript
{
  senderId: ObjectId,        // ID відправника
  receiverId: ObjectId,      // ID отримувача
  text: String,              // Текст повідомлення
  createdAt: Date,           // Час створення
  updatedAt: Date,           // Час оновлення
}
```

---

## 🔒 Безпека

### Rate Limiting
```javascript
const maxRequests = 1000;  // 1000 запитів за хвилину
const windowSize = 60000;  // 60 секунд
```

### JWT Автентифікація
Всі приватні маршути захищені middleware `protect`:
```javascript
router.get('/', protect, getMessages);
```

### CORS
```javascript
const allowedOrigins = ['http://localhost:5173'];
// Тільки frontend з цього домену може звертатися до backend
```

---

## 📈 Перспективи розвитку

1. **Group Chat** - чат для груп користувачів
2. **File Upload** - відправка файлів через Socket.IO
3. **Message History** - пошук в історії повідомлень
4. **Read Receipts** - позначки прочитаних повідомлень
5. **Voice/Video** - голосові та відеозвінки
6. **Push Notifications** - сповіщення на мобільних

---

## 📚 Навчальні матеріали

### Socket.IO документація
- [Official Socket.IO Docs](https://socket.io/docs/)
- [Socket.IO Events](https://socket.io/docs/emit-cheatsheet/)

### Express + MongoDB
- [Express.js Guide](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)

---

## 👨‍💻 Автор

Розроблено як навчальний проект для вивчення:
- Real-time комунікації через WebSocket
- Node.js + Express backend
- React frontend з контекстом
- MongoDB для зберігання даних

---

## 📝 Висновок

Цей проект демонструє реалізацію **real-time чату** з використанням сучасних технологій:

✅ **Socket.IO** забезпечує двосторонній real-time зв'язок між клієнтом та сервером
✅ **MongoDB** зберігає всі повідомлення для історії
✅ **React Context** управляє станом додатку
✅ **JWT** забезпечує безпеку

Основна ідея: замість HTTP polling (запит кожні 3 сек), використовуємо WebSocket, який дає моментальну доставку повідомлень без затримок!

---

