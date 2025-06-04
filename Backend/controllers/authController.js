import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/Users.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';

import validator from 'validator'; // npm i validator

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check required fields
    if (!name || !email || !phone || !password) {
      return apiError(res, 400, 'All fields are required.');
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return apiError(res, 400, 'Invalid email format.');
    }

    // Validate phone - digits only and length 10 (adjust length as per your rules)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return apiError(res, 400, 'Phone number must be exactly 10 digits.');
    }

    // Validate password length
    if (password.length < 6) {
      return apiError(res, 400, 'Password must be at least 6 characters long.');
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return apiError(res, 409, 'Email already in use.');
    }

    // Check if phone already exists
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return apiError(res, 409, 'Phone number already in use.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'user',
    });

    await newUser.save();

    // Respond success
    return apiResponse(res, 201, 'User registered successfully', {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return apiError(res, 500, 'Server error', error);
  }
};


export const checkLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return apiError(res, 401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return apiError(res, 401, 'Invalid email or password');
    }

    const payload = {
      userId: user._id,
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    });

    return apiResponse(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return apiError(res, 500, 'Server error', error);
  }
};
