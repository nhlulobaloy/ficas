import express from 'express';
import { changePassword, getProfile } from '../Controllers/ProfileController.js';
import { authMiddleware } from '../middleware/auth.js';


const router = express.Router();

router.post('update-password', changePassword);
router.get('/', authMiddleware, getProfile); //get the user profile


export default router;