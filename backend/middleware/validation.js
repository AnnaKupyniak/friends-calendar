// Simple input validation middleware
// Validates and sanitizes common input patterns

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeString = (str, maxLength = 500) => {
  if (typeof str !== 'string') return '';
  return String(str)
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential XSS vectors
};

const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return String(str)
    .replace(/[<>&'"]/g, (char) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      };
      return map[char];
    });
};

const sanitizeId = (id) => {
  // MongoDB ObjectId is 24 hex characters
  return String(id).trim();
};

const isValidObjectId = (id) => {
  return String(id).match(/^[0-9a-f]{24}$/i);
};

const validateUserInput = (req, res, next) => {
  const { username, email, password, fullName } = req.body;

  // Validate username if provided
  if (username) {
    if (typeof username !== 'string' || username.trim().length < 2) {
      return res.status(400).json({ message: 'Ім’я користувача має містити щонайменше 2 символи' });
    }
    if (username.length > 50) {
      return res.status(400).json({ message: 'Ім’я користувача має бути менше ніж 50 символів' });
    }
    // Перевірка на спеціальні символи
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ message: 'Ім’я користувача може містити лише літери, цифри, підкреслення та дефіси' });
    }
  }

  // Validate email if provided
  if (email) {
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Неправильний формат електронної пошти' });
    }
  }

  // Validate password if provided
  if (password) {
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Пароль має містити щонайменше 6 символів' });
    }
    if (password.length > 100) {
      return res.status(400).json({ message: 'Пароль занадто довгий' });
    }
  }

  // Validate fullName if provided
  if (fullName) {
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ message: "Повне ім’я має містити щонайменше 2 символи" });
    }
    if (fullName.length > 100) {
      return res.status(400).json({ message: "Повне ім’я має бути менше ніж 100 символів" });
    }
  }

  next();
};

const validateFriendshipInput = (req, res, next) => {
  const { friendId, category } = req.body || req.query;

  if (friendId && !isValidObjectId(friendId)) {
    return res.status(400).json({ message: 'Неправильний формат ID друга' });
  }

  if (category) {
    const cat = sanitizeString(category, 100);
    if (cat.length < 1) {
      return res.status(400).json({ message: 'Категорія не може бути порожньою' });
    }
  }

  next();
};

const validateGroupInput = (req, res, next) => {
  const { title, description, category, memberId, groupId } = req.body || req.params || req.query;

  if (title && (typeof title !== 'string' || title.trim().length < 2)) {
    return res.status(400).json({ message: 'Назва групи має містити щонайменше 2 символи' });
  }

  if (title && title.length > 100) {
    return res.status(400).json({ message: 'Назва групи має бути менше ніж 100 символів' });
  }

  if (description && description.length > 1000) {
    return res.status(400).json({ message: 'Опис занадто довгий' });
  }

  if (category && sanitizeString(category, 100).length < 1) {
    return res.status(400).json({ message: 'Категорія не може бути порожньою' });
  }

  if (memberId && !isValidObjectId(memberId)) {
    return res.status(400).json({ message: 'Неправильний формат ID учасника' });
  }

  if (groupId && !isValidObjectId(groupId)) {
    return res.status(400).json({ message: 'Неправильний формат ID групи' });
  }

  next();
};

const validateMemoryInput = (req, res, next) => {
  const { title, description, tags, category, date, place } = req.body;

  if (title && (typeof title !== 'string' || title.trim().length < 1)) {
    return res.status(400).json({ message: 'Назва є обов’язковою' });
  }

  if (title && title.length > 200) {
    return res.status(400).json({ message: 'Назва має бути менше ніж 200 символів' });
  }

  if (description && description.length > 2000) {
    return res.status(400).json({ message: 'Опис занадто довгий' });
  }

  if (place && place.length > 200) {
    return res.status(400).json({ message: 'Назва місця занадто довга' });
  }

  if (date && isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'Неправильний формат дати' });
  }

  if (category && sanitizeString(category, 100).length < 1) {
    return res.status(400).json({ message: 'Категорія не може бути порожньою' });
  }

  if (tags) {
    let tagsArray = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : []);
    if (tagsArray.length > 20) {
      return res.status(400).json({ message: 'Забагато тегів (максимум 20)' });
    }
    for (const tag of tagsArray) {
      const trimmedTag = tag.trim();
      if (typeof trimmedTag !== 'string' || trimmedTag.length === 0 || trimmedTag.length > 50) {
        return res.status(400).json({ message: 'Кожен тег має містити від 1 до 50 символів' });
      }
    }
  }

  next();
};

const validateCommentInput = (req, res, next) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ message: 'Текст коментаря є обов’язковим' });
  }

  if (text.length > 1000) {
    return res.status(400).json({ message: 'Коментар занадто довгий (максимум 1000 символів)' });
  }

  next();
};

module.exports = {
  validateEmail,
  sanitizeString,
  sanitizeHtml,
  sanitizeId,
  isValidObjectId,
  validateUserInput,
  validateFriendshipInput,
  validateGroupInput,
  validateMemoryInput,
  validateCommentInput,
};
