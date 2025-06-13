import express from 'express';
import { sendTicketEmail, sendCustomEmail } from '../controllers/email.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';


const router = express.Router();

// Send ticket confirmation email
router.post('/send-ticket', authenticateToken, sendTicketEmail);

// Send custom email
router.post('/send', authenticateToken, sendCustomEmail);

export default router;
