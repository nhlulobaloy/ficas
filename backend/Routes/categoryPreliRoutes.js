import express from 'express';
import { getCategoryPreli, getSubCategoryPreli, getDepartmentsPreli} from '../Controllers/CategoryPreliController.js';

const router = express.Router();
router.get('/categories', getCategoryPreli);
router.get('/subcategories', getSubCategoryPreli);
router.get('/departments', getDepartmentsPreli);


export default router; 