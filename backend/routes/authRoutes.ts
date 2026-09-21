import express from 'express'
import {
    SignUp,
    Login,
    VerifyToken,
    getUser,
    logout,
    refreshToken
} from '../controllers/AuthController.js';

import { authMiddleware } from '../middleware/auth.js';


const router = express.Router();

router.post('/signup', SignUp)
router.post('/login', Login)
router.post('/verifyToken', VerifyToken)
router.get('/user', authMiddleware, getUser);
router.delete('/logout', authMiddleware, logout);
router.post('/refresh', refreshToken);

export default router;