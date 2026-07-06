import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Account from '../models/account.model.js';
import User from '../models/user.model.js';

const MAX_ACCOUNT_GENERATION_ATTEMPTS = 20;

const toPublicUser = (user) => {
  const response = user.toObject();
  delete response.password;
  delete response.refreshToken;
  return response;
};

const generateAccountNumber = () =>
  Math.floor(10000000 + Math.random() * 90000000).toString();

const generateIfscCode = () => `NEX00${Math.floor(1000 + Math.random() * 9000)}`;

const getUniqueAccountIdentity = async () => {
  for (let attempt = 0; attempt < MAX_ACCOUNT_GENERATION_ATTEMPTS; attempt += 1) {
    const accountNumber = generateAccountNumber();
    const ifscCode = generateIfscCode();

    const existingAccount = await Account.exists({
      $or: [{ accountNumber }, { ifscCode }],
    });

    if (!existingAccount) {
      return { accountNumber, ifscCode };
    }
  }

  const error = new Error('Unable to generate unique account details. Please try again.');
  error.statusCode = 500;
  throw error;
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

  try {
    const { accountNumber, ifscCode } = await getUniqueAccountIdentity();

    const account = await Account.create({
      userId: user._id,
      accountNumber,
      ifscCode,
      type: 'savings',
      balance: 500000,
    });

    return {
      user: toPublicUser(user),
      account,
    };
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }
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

  const account = await Account.findOne({
    userId: user._id,
    type: 'savings',
    isActive: true,
  });

  return {
    user: toPublicUser(user),
    account,
    accessToken,
  };
};
