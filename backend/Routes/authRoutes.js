import express from 'express'
import {
    SignUp,
    Login,
    VerifyToken,
    getUser
} from '../Controllers/AuthController.js';

import { authMiddleware } from '../middleware/auth.js';


const router = express.Router();

router.post('/signup', SignUp)
router.post('/login', Login)
router.post('/verifyToken', VerifyToken)
router.get('/user', authMiddleware, getUser);

export default router;