import express from 'express';
import { registerUser , checkLogin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/register', registerUser);
router.post('/login' , checkLogin);
router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'You accessed protected route', user: req.user });
});
// router.get('/my-events', authenticateToken, getUserRegisteredEvents);

export default router;
