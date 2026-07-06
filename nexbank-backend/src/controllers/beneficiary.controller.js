import Account from '../models/account.model.js';
import Beneficiary from '../models/beneficiary.model.js';
import User from '../models/user.model.js';

export const listBeneficiaries = async (req, res) => {
  const beneficiaries = await Beneficiary.find({ userId: req.user.userId }).sort({ addedAt: -1 });

  return res.status(200).json({
    success: true,
    message: 'Beneficiaries fetched successfully',
    data: beneficiaries,
  });
};

export const addBeneficiary = async (req, res) => {
  try {
    const { nickName, accountNumber, ifscCode } = req.body;

    const account = await Account.findOne({ accountNumber, ifscCode, isActive: true });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary account not found',
      });
    }

    if (account.userId.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own account as a beneficiary',
      });
    }

    const user = await User.findById(account.userId);
    const beneficiary = await Beneficiary.create({
      userId: req.user.userId,
      nickName,
      accountNumber,
      ifscCode,
      accountHolderName: `${user.firstName} ${user.lastName}`.trim(),
      isVerified: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Beneficiary added successfully',
      data: beneficiary,
    });
  } catch (error) {
    return res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: error.code === 11000 ? 'Beneficiary already exists' : error.message,
    });
  }
};

export const removeBeneficiary = async (req, res) => {
  const beneficiary = await Beneficiary.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.userId,
  });

  if (!beneficiary) {
    return res.status(404).json({
      success: false,
      message: 'Beneficiary not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Beneficiary removed successfully',
  });
};
