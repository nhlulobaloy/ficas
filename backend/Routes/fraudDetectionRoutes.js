import express from 'express';
const router = express.Router();

import { 
  getPrevention, 
  //returnCase, 
  //assignInvestigator, 
  //referCase, 
  //closeCase, 
  getDetectionCase, 
  //getDetectionReview, 
  updateCase, 
  //getInvestigators, 
  //getDetectionCases 
} from '../Controllers/FraudDetectionController.js';

import { authMiddleware } from '../middleware/auth.js';



router.get('/', authMiddleware, getPrevention);//get the prevention case

router.get('/:id', getDetectionCase);//get the single detection case

//router.put('/assign/:id', assignInvestigator);

router.put('/case/update/:id', updateCase);

//router.get('/investigators/detection', getInvestigators);

//router.get('/review/detection', getDetectionCases);

//router.get('/review/case/:id', getDetectionReview);

//router.put('/close/case/:id', closeCase);

//router.put('/refer/case/:id', referCase);

///router.post('/return/case/:id', returnCase);

export default router;