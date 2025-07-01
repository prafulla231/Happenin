import express from 'express';
import { registerUser , checkLogin,sendOtpToEmail, verifyOtpAndLogin} from '../controllers/authController.js';
import { authenticateToken , authenticate } from '../middleware/authMiddleware.js';
import { dashboardRedirect } from '../controllers/dashboardController.js';

const router = express.Router();



/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User Registration & Login APIs
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin, organizer]
 *             required: [name, email, phone, password]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request or missing fields
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post('/register', registerUser);


/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login user and get token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required: [email, password]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', checkLogin);
router.get('/dashboard', authenticate, dashboardRedirect);

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Protected test route (token required)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Access granted
 *       401:
 *         description: Unauthorized
 */
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You accessed protected route', user: req.user });
});

router.post('/send-otp', sendOtpToEmail);

// Verify OTP Route
router.post('/verify-otp', verifyOtpAndLogin);


// router.get('/my-events', authenticateToken, getUserRegisteredEvents);

export default router;
