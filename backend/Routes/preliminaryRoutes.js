import express from 'express';
import { 
  createPreli, 
  getPreli, 
  updatePreli, 
  getPrelis,
  getPreliminaries, 
  getForensicInvestigators,
  returnPreliminary,
  approvePreliminary,
  verifyAccessUpdatePreliminary,
  verifyAccessReviewPreliminary,
  getPreliReviewTeam,
  referToDepartment,
  closeCase,
  getIncidentsAssigned,
  assignInvestigator
} from '../Controllers/PreliminaryController.js'; 
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

//review preliminary 
router.get('/', getPreliminaries);//get the preliminary cases for the review

router.put('/assign/:id', assignInvestigator)//assing the forensic investigator to this case
//preliminary routes
//router.post('/', createPreli);  
router.get('/case/:incident_id', authMiddleware, getPreli);//when user clicks draft you get a single preliminary{needed}
router.get('/review/:incident_id', getPreliReviewTeam);//for the review team get's a single one
router.put('/:incident_id', authMiddleware, updatePreli);//update the preliminary in the review preliminary
//router.get('/get-Prelis', getPrelis);
router.get('/investigators', getForensicInvestigators);//get the forensic investigators
//router.get('/investigators', getPreliminaryInvestigators);//get the preliminary investigators
router.post('/return/:preli_id',authMiddleware, returnPreliminary);//return the preliminary to the preliminary investigator
router.put('/approve-Preli/:preli_id', approvePreliminary);//approve a preliminary case
router.post('/verify-access-update-preliminary', verifyAccessUpdatePreliminary);//
router.get('/auth/access', authMiddleware, verifyAccessReviewPreliminary);//verify if the user has access to this page
router.put('/refer/:id', referToDepartment);
router.put('/close/:id', closeCase);//close the forensic

//from the incident table
router.get('/assigned', authMiddleware, getIncidentsAssigned)//get the assigned incidents for the preliminary investigator{needed}









export default router;