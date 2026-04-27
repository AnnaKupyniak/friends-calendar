# Нові функції API - Документація

## 1. Система сповіщень (Notifications)

### Моделі
- **Notification** - модель для зберігання сповіщень користувачів

### Типи сповіщень
- `new_message` - нове повідомлення
- `new_comment` - новий коментар
- `friend_request` - запит у друзі
- `memory_created` - спогад створено
- `group_invite` - запрошення до групи

### API Endpoints

#### Отримати всі сповіщення
```
GET /api/notifications
Query params: page=1, limit=20
Header: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "recipientId": "...",
      "senderId": { "username": "...", "fullName": "...", "avatar": "..." },
      "type": "new_comment",
      "title": "Новий коментар",
      "message": "Вам додано коментар",
      "relatedId": "...",
      "relatedModel": "Memory",
      "isRead": false,
      "createdAt": "2026-04-27T..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50, "pages": 3 }
}
```

#### Отримати непрочитані сповіщення
```
GET /api/notifications/unread
Header: Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

#### Позначити сповіщення як прочитане
```
PUT /api/notifications/:notificationId/read
Header: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { "_id": "...", "isRead": true }
}
```

#### Позначити все як прочитане
```
PUT /api/notifications/read-all
Header: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### Видалити сповіщення
```
DELETE /api/notifications/:notificationId
Header: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## 2. Теги/Мітки для спогадів

### Розширена модель Memory
```javascript
{
  ...
  tags: ["trip", "beach", "2024"], // масив рядків, нижний регістр
  ...
}
```

### Създання спогаду з тегами
```
POST /api/memories
Header: Authorization: Bearer <token>
Body:
{
  "entityId": "...",
  "entityType": "Friendship|Group",
  "title": "Відпустка на морі",
  "description": "...",
  "date": "2024-07-15",
  "place": "Крим",
  "category": "Відпустка",
  "tags": ["trip", "beach", "friends"] // опціонально
}
```

#### Отримати всі теги користувача
```
GET /api/memories/tags
Header: Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 15,
  "data": ["beach", "family", "friends", "party", "trip", ...]
}
```

---

## 3. Поліпшена валідація та санітизація

### Нові функції валідації

#### validateCommentInput
- Перевіряє що коментар є рядком і не пустий
- Максимально 1000 символів

#### sanitizeHtml
- Санітизує HTML символи (<, >, &, тощо)
- Запобігає XSS атакам

#### isValidObjectId
- Перевіряє валідність MongoDB ObjectId

### Валідація дляMemoryInput розширена
- Валідація дати
- Перевірка місця
- Покращена обробка тегів

---

## 4. Пошук та фільтрація спогадів

### Пошук та фільтр
```
GET /api/memories/search
Query params:
- query (текст для пошуку) - опціонально
- tags (теги, розділені комами) - опціонально
- startDate (YYYY-MM-DD) - опціонально
- endDate (YYYY-MM-DD) - опціонально
- place (місце) - опціонально
- category (категорія) - опціонально
- sortBy (createdAt|date|title|newest|oldest) - за замовчуванням createdAt

Header: Authorization: Bearer <token>

Приклади:
GET /api/memories/search?query=пляж
GET /api/memories/search?tags=beach,trip&startDate=2024-01-01
GET /api/memories/search?place=Крим&sortBy=date
GET /api/memories/search?category=Відпустка

Response:
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

---

## 5. Експорт даних

### Експорт у CSV
```
GET /api/memories/export/csv
Query params:
- entityId (опціонально) - експорт спогадів конкретної дружби/групи

Header: Authorization: Bearer <token>

Response: CSV файл (memories_export.csv)
Колонки: Title, Description, Date, Place, Category, Tags, Comments Count, Created At
```

### Експорт у HTML/PDF
```
GET /api/memories/export/pdf
Query params:
- entityId (опціонально) - експорт спогадів конкретної дружби/групи

Header: Authorization: Bearer <token>

Response: HTML файл (memories_export.html) - можна конвертувати в PDF через браузер
```

---

## Примери використання

### JavaScript/Fetch

#### Отримати сповіщення
```javascript
const response = await fetch('http://localhost:5000/api/notifications?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

#### Пошук спогадів
```javascript
const response = await fetch(
  'http://localhost:5000/api/memories/search?query=відпустка&tags=trip,beach&sortBy=date',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const data = await response.json();
```

#### Експорт у CSV
```javascript
const response = await fetch('http://localhost:5000/api/memories/export/csv', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'memories_export.csv';
a.click();
```

---

## Інтеграція з контролерами

### Створення сповіщення
```javascript
const { createNotification } = require('../controllers/notificationController');

// Приклад: коли хтось додає коментар
const notification = await createNotification(
  memoryAuthorId,
  'new_comment',
  'Новий коментар',
  `${req.user.fullName} додав коментар до вашого спогаду`,
  req.user._id,
  memoryId,
  'Memory'
);
```

### Використання у контролерах
```javascript
// У createComment контролері
exports.createComment = async (req, res) => {
  // ... логіка коментарію ...
  
  // Генеруємо сповіщення
  const { createNotification } = require('../controllers/notificationController');
  const memory = await Memory.findById(memoryId);
  
  // Сповісти усім учасникам
  const friendship = await Friendship.findById(memory.entity);
  for (const userId of friendship.users) {
    if (userId.toString() !== req.user._id.toString()) {
      await createNotification(
        userId,
        'new_comment',
        'Новий коментар',
        `${req.user.fullName} додав коментар`,
        req.user._id,
        memoryId,
        'Memory'
      );
    }
  }
};
```

---

## Плани подальших покращень

1. Email сповіщення (з використанням Nodemailer)
2. Real-time сповіщення через Socket.io
3. Push-сповіщення в мобільному додатку
4. Налаштування преференцій сповіщень користувачем
5. Дефрагментація старих сповіщень
6. Генерація PDF через pdf-lib або html2pdf
7. Розширена статистика (хто найчастіше коментує, тощо)
