import express from 'express';
import { uploadLaw } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js'; // Assuming you have multer upload middleware

const router = express.Router();

// Admin Route: Upload a new law (PDF) to Vector DB
// POST /api/admin/upload-law
router.post('/upload-law', protect, admin, upload.single('document'), uploadLaw);

export default router;
