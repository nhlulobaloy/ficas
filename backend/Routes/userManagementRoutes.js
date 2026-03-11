import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUsers, updateUser } from '../Controllers/UserManagementController.js';

const router = express.Router();
router.get('/', authMiddleware, getUsers); 
router.post('/update', authMiddleware, updateUser); 
export default router;