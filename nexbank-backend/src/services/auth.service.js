import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Account from '../models/account.model.js';
import User from '../models/user.model.js';
import { addDefaultBeneficiaryForUser } from './default-beneficiary.service.js';

const MAX_ACCOUNT_GENERATION_ATTEMPTS = 20;
const SESSION_DURATION_MS = 20 * 60 * 1000;

const createAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '20m',
    },
  );

const createRefreshToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      tokenVersion: Date.now(),
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
  );

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

    await addDefaultBeneficiaryForUser(user._id);

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

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.refreshToken = refreshToken;
  user.sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await user.save();

  const account = await Account.findOne({
    userId: user._id,
    type: 'savings',
    isActive: true,
  });

  return {
    user: toPublicUser(user),
    account,
    accessToken,
    refreshToken,
  };
};

export const refreshUserSession = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required.');
    error.statusCode = 401;
    throw error;
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET,
    );
  } catch {
    const error = new Error('Refresh token is invalid or expired.');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findOne({
    _id: decodedToken.userId,
    refreshToken,
  });

  if (!user || (user.sessionExpiresAt && user.sessionExpiresAt.getTime() <= Date.now())) {
    if (user) {
      user.refreshToken = null;
      user.sessionExpiresAt = null;
      await user.save();
    }

    const error = new Error('Your session has expired. Please sign in again.');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = createAccessToken(user);
  const nextRefreshToken = createRefreshToken(user);
  user.refreshToken = nextRefreshToken;
  user.sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await user.save();

  const account = await Account.findOne({
    userId: user._id,
    type: 'savings',
    isActive: true,
  });

  return {
    user: toPublicUser(user),
    account,
    accessToken,
    refreshToken: nextRefreshToken,
  };
};

export const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  await User.updateOne(
    { refreshToken },
    { $set: { refreshToken: null, sessionExpiresAt: null } },
  );
};

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword || newPassword.length < 5) {
    const error = new Error('Please provide your current password and a new password of at least 5 characters.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    const error = new Error('Your current password is incorrect.');
    error.statusCode = 401;
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error('Your new password must be different from your current password.');
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.refreshToken = null;
  user.sessionExpiresAt = null;
  await user.save();
};
