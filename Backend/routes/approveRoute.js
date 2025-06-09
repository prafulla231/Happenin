import { approveEvent , denyRequest, viewApprovalRequest, viewApprovalRequestforOrganizer } from '../controllers/approvalController.js';
import express from 'express';
const router = express.Router();

router.post('/approveEvent',approveEvent);
router.get('/viewApproval' , viewApprovalRequest)
router.delete('/deny/:id', denyRequest);
router.get('/viewrequests/:id' , viewApprovalRequestforOrganizer);

export default router;