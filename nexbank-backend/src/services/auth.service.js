import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

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
  const response = user.toObject();
  delete response.password;
  delete response.refreshToken;

  return response;
};