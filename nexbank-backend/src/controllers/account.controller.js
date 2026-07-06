import Account from '../models/account.model.js';

export const getMyAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      userId: req.user.userId,
      isActive: true,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account fetched successfully',
      data: account,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
