# Friends Calendar

Friends Calendar — навчальний проєкт для спілкування з друзями, подій і спільного календаря. У ньому є React-фронтенд, Node.js/Express бекенд, MongoDB і чат у реальному часі через Socket.IO.

## Можливості проєкту

- реєстрація та вхід у систему
- чат між користувачами в реальному часі через Socket.IO
- створення та перегляд подій у календарі
- планування подій на майбутні дати
- додавання спогадів і фотографій
- робота з друзями та групами
- захищені маршрути через JWT
- завантаження аватарів і медіа-файлів
- збереження даних у MongoDB

## Структура

```text
friends-calendar/
├── frontend/   React-додаток
└── backend/    Express API, Socket.IO та MongoDB
```

## Технології

Frontend:

- React
- Vite
- React Router
- Socket.IO Client
- Axios

Backend:

- Node.js
- Express
- Socket.IO
- MongoDB і Mongoose
- JWT

## Запуск локально

### 1. Встановити залежності

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Додати змінні середовища

У папці backend створити файл `.env`:

```env
MONGO_URI=mongodb://localhost:27017/friends-calendar
PORT=5000
JWT_SECRET=your_secret_key
```

### 3. Запустити бекенд

```bash
cd backend
npm start
```

### 4. Запустити фронтенд

```bash
cd frontend
npm run dev
```



