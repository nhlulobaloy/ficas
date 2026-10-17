import express from 'express';
import {
    referToDepartment, assignInvestigator, getInvestigators, getPreliminary,
    getForensics, closeCase, returnPreliminary, getForensic, updateForensic,
    verifyAccessReviewForensic, getForensicReview,
    getDistributionList, saveDistributionList,
    getAbbreviations, saveAbbreviations,
    getPhrases, savePhrases,
    getIndividuals, saveIndividuals,
    getAnnexures, saveAnnexures,
} from '../controllers/ForensicController.js';

import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
// --- specific routes first ---
router.get('/auth/access', verifyAccessReviewForensic);
router.get('/review/:id', getForensicReview);
router.get('/case/review/', getForensics);
router.get('/case/investigators', getInvestigators);
router.put('/case/assign/:id', assignInvestigator);

router.get('/distribution/:forensicId', authMiddleware, getDistributionList);
router.put('/distribution/:forensicId', authMiddleware, saveDistributionList);

router.get("/abbreviations/:forensicId", authMiddleware, getAbbreviations);
router.put("/abbreviations/:forensicId", authMiddleware, saveAbbreviations);
router.get("/phrases/:forensicId",       authMiddleware, getPhrases);
router.put("/phrases/:forensicId",       authMiddleware, savePhrases);
router.get("/individuals/:forensicId",   authMiddleware, getIndividuals);
router.put("/individuals/:forensicId",   authMiddleware, saveIndividuals);
router.get("/annexures/:forensicId",     authMiddleware, getAnnexures);
router.put("/annexures/:forensicId",     authMiddleware, saveAnnexures);

router.put('/refer/:id', referToDepartment);
router.put('/close/:id', closeCase);
router.post('/return/:id', returnPreliminary);
router.put('/update/:id', updateForensic);
router.get('/', authMiddleware, getPreliminary);

// --- wildcard LAST ---
router.get('/:id', getForensic);

export default router;