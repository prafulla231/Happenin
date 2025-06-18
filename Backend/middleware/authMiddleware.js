import jwt from 'jsonwebtoken';
import { apiError } from '../utils/apiError.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; //checks for token in authorization header
  console.log('Auth header:', authHeader);
  if (!authHeader) return apiError(res, 401, 'No token provided');

  const token = authHeader.split(' ')[1];
  if (!token) return apiError(res, 401, 'Malformed token');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return apiError(res, 403, 'Invalid or expired token');
    req.user = user; // userId, role, email
    next();
  });
};
