import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required',
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const hasActiveSession = await User.exists({
      _id: req.user.userId,
      sessionExpiresAt: { $gt: new Date() },
    });

    if (!hasActiveSession) {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.',
      });
    }

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
