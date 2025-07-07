// authController.js 

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/Users.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import validator from 'validator'; // npm i validator

dotenv.config(); // make sure you load your .env


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

    // Validate phone - digits only and length 10 
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
    const hashedPassword = await bcrypt.hash(password, 10); //salt rounds set to 10

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
      userId: newUser._id,
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




export const sendOtpToEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  let user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'User does not exist. Try valid email.' }); // or block if only registered users allowed
  }

  user.otp = { code: otp, expiresAt: expiry };
  await user.save();

  const html = `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes.</p>`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Login OTP',
    html
  });

  res.json({ success: true, message: 'OTP sent to email' });
};


export const verifyOtpAndLogin = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.otp) return res.status(400).json({ message: 'OTP not found' });

  if (user.otp.code !== otp || new Date(user.otp.expiresAt) < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const payload = {
      userId: user._id.toString(),
      userName : user.name,
      role: user.role,
      email: user.email,
    };

  // OTP matched — issue token
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  // Optional: Clear OTP after login
  user.otp = undefined;
  await user.save();

  return apiResponse(res, 200, 'Login successful', {
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email
      },
    });
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});


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
      userId: user._id.toString(),
      userName : user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    });

    return apiResponse(res, 200, 'Login successful', {
      token,
      user: {
        name: user.name,
        email: user.email
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return apiError(res, 500, 'Server error', error);
  }
};

