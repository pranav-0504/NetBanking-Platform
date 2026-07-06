import { registerUser } from '../services/auth.service.js';

export const register = async (req, res) => {
  
  try {
    const user = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: user,
    });
  } 
  
  catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};