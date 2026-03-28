import express from 'express';
const router = express.Router();
// Controller se functions import karein (Extension .js lagana zaruri hai ESM mein)
import { signup, login } from '../controllers/authController.js';

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

export default router;