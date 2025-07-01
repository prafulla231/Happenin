import jwt from 'jsonwebtoken';
import { apiError } from '../utils/apiError.js';
import { User } from '../models/Users.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; //checks for token in authorization header
  if (!authHeader) return apiError(res, 401, 'No token provided');

  const token = authHeader.split(' ')[1];
  if (!token) return apiError(res, 401, 'Malformed token');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return apiError(res, 403, 'Invalid or expired token');
    req.user = user; // userId, role, email
    next();
  });
};

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return apiError(res, 401, 'No token provided');

  try {
    // console.log('Token received:', token); // Debug log
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('Decoded token:', decoded); // Debug log
    
    const user = await User.findById(decoded.userId);
    if (!user) return apiError(res, 404, 'User not found');

    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error('Token verification error:', err); // Debug log
    return apiError(res, 403, 'Token invalid or expired');
  }
};