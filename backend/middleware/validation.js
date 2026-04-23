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

const sanitizeId = (id) => {
  // MongoDB ObjectId is 24 hex characters
  return String(id).trim();
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

  if (friendId && (!String(friendId).match(/^[0-9a-f]{24}$/i))) {
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

  if (memberId && (!String(memberId).match(/^[0-9a-f]{24}$/i))) {
    return res.status(400).json({ message: 'Invalid member ID format' });
  }

  if (groupId && (!String(groupId).match(/^[0-9a-f]{24}$/i))) {
    return res.status(400).json({ message: 'Invalid group ID format' });
  }

  next();
};

const validateMemoryInput = (req, res, next) => {
  const { title, description, tags, category } = req.body;

  if (title && (typeof title !== 'string' || title.trim().length < 1)) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (title && title.length > 200) {
    return res.status(400).json({ message: 'Title must be less than 200 characters' });
  }

  if (description && description.length > 2000) {
    return res.status(400).json({ message: 'Description is too long' });
  }

  if (category && sanitizeString(category, 100).length < 1) {
    return res.status(400).json({ message: 'Category cannot be empty' });
  }

  if (tags && Array.isArray(tags)) {
    if (tags.length > 20) {
      return res.status(400).json({ message: 'Too many tags (max 20)' });
    }
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.length > 50) {
        return res.status(400).json({ message: 'Tag must be less than 50 characters' });
      }
    }
  }

  next();
};

module.exports = {
  validateEmail,
  sanitizeString,
  sanitizeId,
  validateUserInput,
  validateFriendshipInput,
  validateGroupInput,
  validateMemoryInput,
};
