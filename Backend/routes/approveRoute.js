import express from 'express';
import {approveEvent , viewApprovalRequest , denyRequest,viewApprovalRequestforOrganizer} from '../controllers/approvalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();
// router.use(authenticateToken);

 
/**
 * @swagger
 * /approvals/approveEvent:
 *   post:
 *     summary: Approve an event and move it to the events collection
 *     tags:
 *       - Approval
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *               - title
 *               - date
 *               - maxRegistrations
 *               - createdBy
 *             properties:
 *               _id:
 *                 type: string
 *                 description: Approval document ID to delete
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: string
 *               duration:
 *                 type: string
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               maxRegistrations:
 *                 type: integer
 *               createdBy:
 *                 type: string
 *               artist:
 *                 type: string
 *               organization:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created and approval deleted successfully
 *       400:
 *         description: Bad request (missing required fields)
 *       500:
 *         description: Server error
 */
router.post('/approveEvent',authenticateToken,approveEvent);


/**
 * @swagger
 *  /approvals/viewApproval:
 *   get:
 *     summary: View all approval requests
 *     tags:
 *       - Approval
 *     responses:
 *       200:
 *         description: List of approval requests fetched successfully
 *       500:
 *         description: Server error while fetching approvals
 */
router.get('/viewApproval', authenticateToken,viewApprovalRequest);


/**
 * @swagger
 *  /approvals/deny/{id}:
 *   delete:
 *     summary: Deny an approval request by deleting it
 *     tags:
 *       - Approval
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the approval request to delete
 *     responses:
 *       200:
 *         description: Approval request deleted successfully
 *       400:
 *         description: Invalid event id
 *       404:
 *         description: Event not found or already deleted
 *       500:
 *         description: Server error
 */
router.delete('/deny/:id',authenticateToken, denyRequest);


/**
 * @swagger
 *  /approvals/viewrequests/{id}:
 *   get:
 *     summary: View approval requests for a specific organizer
 *     tags:
 *       - Approval
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (organizer ID)
 *     responses:
 *       200:
 *         description: Events fetched successfully for the organizer
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error while fetching events
 */
router.get('/viewrequests/:id',authenticateToken, viewApprovalRequestforOrganizer);
export default router;