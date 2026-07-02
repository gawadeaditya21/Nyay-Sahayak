import express from 'express';
const router = express.Router();
// Controller se functions import karein (Extension .js lagana zaruri hai ESM mein)
import { signup, login, getCurrentUser, updateLanguagePreference } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', protect, getCurrentUser);

// PUT /api/auth/language
router.put('/language', updateLanguagePreference);

export default router;