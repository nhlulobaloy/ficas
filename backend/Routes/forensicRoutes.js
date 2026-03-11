import express from 'express';
import { referToDepartment, assignInvestigator, getInvestigators, getPreliminary,  getForensics/*closeForensicCase*/, closeCase, returnPreliminary, getForensic, updateForensic, verifyAccessReviewForensic, getForensicReview} from '../Controllers/ForensicController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.put('/refer/:id', referToDepartment);//refer the forensic case
router.put('/close/:id', closeCase);//close the forensic
router.post('/return/:id', returnPreliminary)//return the preliminary
router.get('/:id', getForensic)//get a single a forensic
router.put('/update/:id', updateForensic)//update a single forensic
router.get('/auth/access', verifyAccessReviewForensic)//verify the access to the page

router.get('/', authMiddleware, getPreliminary);//get a list of preliminary to display to the forensic
//router.get('/api/investigators', getForensicInvestigators);//get the forensic investigators
router.get('/review/:id', getForensicReview);//get the case for the review team

router.get('/case/review/', getForensics);//get a list of preliminary to display to the forensic
router.get('/case/investigators', getInvestigators);//get a list of preliminary to display to the forensic
router.put('/case/assign/:id', assignInvestigator);//

//router.put('/close-forensic-case/:id', closeForensicCase); 

export default router; 