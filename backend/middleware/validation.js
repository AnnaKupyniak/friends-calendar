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
      return res.status(400).json({ message: 'Username must be at least 2 characters' });
    }
    if (username.length > 50) {
      return res.status(400).json({ message: 'Username must be less than 50 characters' });
    }
    // Перевірка на спеціальні символи
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, underscores and hyphens' });
    }
  }

  // Validate email if provided
  if (email) {
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
  }

  // Validate password if provided
  if (password) {
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (password.length > 100) {
      return res.status(400).json({ message: 'Password is too long' });
    }
  }

  // Validate fullName if provided
  if (fullName) {
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters' });
    }
    if (fullName.length > 100) {
      return res.status(400).json({ message: 'Full name must be less than 100 characters' });
    }
  }

  next();
};

const validateFriendshipInput = (req, res, next) => {
  const { friendId, category } = req.body || req.query;

  if (friendId && !isValidObjectId(friendId)) {
    return res.status(400).json({ message: 'Invalid friend ID format' });
  }

  if (category) {
    const cat = sanitizeString(category, 100);
    if (cat.length < 1) {
      return res.status(400).json({ message: 'Category cannot be empty' });
    }
  }

  next();
};

const validateGroupInput = (req, res, next) => {
  const { title, description, category, memberId, groupId } = req.body || req.params || req.query;

  if (title && (typeof title !== 'string' || title.trim().length < 2)) {
    return res.status(400).json({ message: 'Group title must be at least 2 characters' });
  }

  if (title && title.length > 100) {
    return res.status(400).json({ message: 'Group title must be less than 100 characters' });
  }

  if (description && description.length > 1000) {
    return res.status(400).json({ message: 'Description is too long' });
  }

  if (category && sanitizeString(category, 100).length < 1) {
    return res.status(400).json({ message: 'Category cannot be empty' });
  }

  if (memberId && !isValidObjectId(memberId)) {
    return res.status(400).json({ message: 'Invalid member ID format' });
  }

  if (groupId && !isValidObjectId(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID format' });
  }

  next();
};

const validateMemoryInput = (req, res, next) => {
  const { title, description, tags, category, date, place } = req.body;

  if (title && (typeof title !== 'string' || title.trim().length < 1)) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (title && title.length > 200) {
    return res.status(400).json({ message: 'Title must be less than 200 characters' });
  }

  if (description && description.length > 2000) {
    return res.status(400).json({ message: 'Description is too long' });
  }

  if (place && place.length > 200) {
    return res.status(400).json({ message: 'Place name is too long' });
  }

  if (date && isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  if (category && sanitizeString(category, 100).length < 1) {
    return res.status(400).json({ message: 'Category cannot be empty' });
  }

  if (tags) {
    let tagsArray = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : []);
    if (tagsArray.length > 20) {
      return res.status(400).json({ message: 'Too many tags (max 20)' });
    }
    for (const tag of tagsArray) {
      const trimmedTag = tag.trim();
      if (typeof trimmedTag !== 'string' || trimmedTag.length === 0 || trimmedTag.length > 50) {
        return res.status(400).json({ message: 'Each tag must be 1-50 characters' });
      }
    }
  }

  next();
};

const validateCommentInput = (req, res, next) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  if (text.length > 1000) {
    return res.status(400).json({ message: 'Comment is too long (max 1000 characters)' });
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
