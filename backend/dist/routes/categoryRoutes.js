import express from 'express';
import { getCategory } from '../controllers/CategoryController.js';
const router = express.Router();
router.get('/', getCategory);
export default router;
