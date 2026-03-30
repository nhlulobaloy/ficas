import express from 'express';
import { createIncident, getIncidents, getIncidentInvestigators, getIncident, updateIncident, verifyAccessCreate, verifyAccessAssign } from '../Controllers/IncidentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.post('/', authMiddleware, createIncident);//create the incident
router.get('/', authMiddleware, getIncidents)//get all the incidents for the review team
router.get('/:incident_id',authMiddleware, getIncident);//get the specific incident for the draft preliminary team
router.put('/:incident_id', authMiddleware, updateIncident);//update the incident in the review incident page
router.post('/auth', authMiddleware, verifyAccessCreate);//verify the access of the page
router.get('/auth/access', authMiddleware, verifyAccessAssign);//controlles access to the incident review
router.get('/api/investigators', authMiddleware, getIncidentInvestigators);//get the preliminary investigators
  
export default router;  