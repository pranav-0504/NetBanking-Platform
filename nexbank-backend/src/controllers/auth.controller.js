import { loginUser, registerUser } from '../services/auth.service.js';

export const register = async (req, res) => {
  
  try {
    const data = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data,
    });
  } 
  
  catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const data = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
