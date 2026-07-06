import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const toPublicUser = (user) => {
  const response = user.toObject();
  delete response.password;
  delete response.refreshToken;
  return response;
};

export const registerUser = async (userData) => {
  const { firstName, lastName, email, mobile, password } = userData;

  // Check email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    
    const error = new Error('A user with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Check mobile already exists
  const existingMobile = await User.findOne({ mobile });

  if (existingMobile) {
    const error = new Error('A user with this mobile number already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    mobile,
    password: hashedPassword,
  });

  // Never return password
  return toPublicUser(user);
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email?.toLowerCase().trim() });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    },
  );

  return {
    user: toPublicUser(user),
    accessToken,
  };
};
