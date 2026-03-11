import express from 'express';
import { verifyReview, verifyDraft, getForensic, returnCase, assignInvestigator, referCase, closeCase, getFraudCase, getFraudReview, updateCase, getInvestigators, getFraudCases } from '../Controllers/FraudPrevetionController.js';
import { authMiddleware } from '../middleware/auth.js';


const router = express.Router();

router.get('/',authMiddleware, getForensic);//get a list of preliminary to display to the ForegetForensic

router.get('/:id', getFraudCase);//get a single fraud case

router.put('/assign/:id', assignInvestigator);//get a single fraud case

router.put('/case/update/:id', updateCase)//update a single case 

router.get('/investigators/prevention', getInvestigators)//get the investigators



router.get('/review/prevention', getFraudCases);//get all the fraud cases for the review team

router.get('/review/case/:id', getFraudReview)//get a single case for the review team

router.put('/close/case/:id', closeCase)//get a single case for the review team

router.put('/refer/case/:id', referCase)//refer a single case for the review team

router.post('/return/case/:id', returnCase)//get a single case for the review team


router.get('/auth/access', authMiddleware, verifyReview);

router.get('/auth/access/draft', authMiddleware, verifyDraft);
//router.get('/cases', getFraudCases);//get a single fraud case








export default router;
