import express from 'express';
import { getCategory } from '../Controllers/CategoryController.js';

const router = express.Router();
router.get('/', getCategory);

export default router;