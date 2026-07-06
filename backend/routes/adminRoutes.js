import express from 'express';
import { 
    uploadLaw, 
    getDashboardStats, 
    getUsers, 
    updateUserRole, 
    deleteUser, 
    getLaws, 
    deleteLaw, 
    getAuditLogs 
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Dashboard Analytics
router.get('/analytics/dashboard', protect, admin, getDashboardStats);

// User Management
router.get('/users', protect, admin, getUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.delete('/users/:id', protect, admin, deleteUser);

// Law Management
router.get('/laws', protect, admin, getLaws);
router.delete('/laws/:id', protect, admin, deleteLaw);
router.post('/upload-law', protect, admin, upload.single('document'), uploadLaw);

// Audit Logs
router.get('/logs', protect, admin, getAuditLogs);

export default router;
