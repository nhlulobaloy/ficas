import express from 'express';
import { changePassword } from '../Controllers/ProfileController.js';


const router = express.Router();

router.post('update-password', changePassword);


export default router