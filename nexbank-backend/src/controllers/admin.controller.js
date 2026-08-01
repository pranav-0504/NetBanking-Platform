import Account from "../models/account.model.js";
import Beneficiary from "../models/beneficiary.model.js";
import FraudAlert from "../models/fraudAlert.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";

export const getAdminOverview = async (_req, res) => {
  try {
    const [
      totalUsers,
      activeAccounts,
      beneficiaryCount,
      totalBalance,
      transactionCount,
      transactionVolume,
      pendingTransactions,
      pendingAlerts,
      recentTransactions,
      recentUsers,
      fraudAlerts,
    ] = await Promise.all([
      User.countDocuments(),
      Account.countDocuments({ isActive: true }),
      Beneficiary.countDocuments(),
      Account.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({ status: "pending" }),
      FraudAlert.countDocuments({ status: "pending" }),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "txnId amount transferMode status isFlagged fraudScore createdAt fromUserId toUserId",
        )
        .populate("fromUserId", "firstName lastName email")
        .populate("toUserId", "firstName lastName email"),
      User.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select(
          "firstName lastName email mobile role isEmailVerified createdAt",
        ),
      FraudAlert.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("userId", "firstName lastName email")
        .populate("transactionId", "txnId amount")
        .select(
          "reason ruleTriggered fraudScore status createdAt userId transactionId",
        ),
    ]);
    return res
      .status(200)
      .json({
        success: true,
        data: {
          metrics: {
            totalUsers,
            activeAccounts,
            beneficiaryCount,
            transactionCount,
            pendingTransactions,
            pendingAlerts,
            totalBalance: totalBalance[0]?.total || 0,
            transactionVolume: transactionVolume[0]?.total || 0,
          },
          recentTransactions,
          recentUsers,
          fraudAlerts,
        },
      });
  } catch {
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to load administrator dashboard data.",
      });
  }
};

export const getAdminOperations = async (_req, res) => {
  try {
    const [users, accounts, transactions] = await Promise.all([
      User.find().sort({ createdAt: -1 }).select('firstName lastName email mobile role isEmailVerified isMobileVerified createdAt'),
      Account.find().sort({ createdAt: -1 }).populate('userId', 'firstName lastName email').select('accountNumber ifscCode type balance isActive currency createdAt userId'),
      Transaction.find().sort({ createdAt: -1 }).populate('fromUserId', 'firstName lastName email').populate('toUserId', 'firstName lastName email').populate('fromAccountId', 'accountNumber').populate('toAccountId', 'accountNumber').select('txnId amount transferMode status description isFlagged fraudScore createdAt fromUserId toUserId fromAccountId toAccountId'),
    ]);
    return res.status(200).json({ success: true, data: { users, accounts, transactions } });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to load administrator operations data.' });
  }
};

export const clearPendingTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate({ _id: req.params.transactionId, status: 'pending' }, { $set: { status: 'completed', completedAt: new Date() } }, { new: true });
    if (!transaction) return res.status(404).json({ success: false, message: 'A pending transaction was not found.' });

    const sourceAccount = await Account.findById(transaction.fromAccountId);
    if (!sourceAccount || sourceAccount.balance < transaction.amount) {
      transaction.status = 'failed';
      transaction.description = `${transaction.description || 'Transfer'} - unable to clear due to insufficient balance`;
      await transaction.save();
      return res.status(400).json({ success: false, message: 'Transaction could not be cleared because the source account has insufficient balance.' });
    }
    await Promise.all([
      Account.findByIdAndUpdate(transaction.fromAccountId, { $inc: { balance: -transaction.amount } }),
      Account.findByIdAndUpdate(transaction.toAccountId, { $inc: { balance: transaction.amount } }),
    ]);
    return res.status(200).json({ success: true, message: 'Pending transaction cleared successfully.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to clear this transaction.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (String(req.user.userId) === String(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own administrator account.' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) {
      return res.status(400).json({ success: false, message: 'The last administrator account cannot be deleted.' });
    }

    await Promise.all([
      Account.deleteMany({ userId: user._id }),
      Beneficiary.deleteMany({ userId: user._id }),
      FraudAlert.deleteMany({ userId: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);
    return res.status(200).json({ success: true, message: 'User and associated account data deleted successfully.' });
  } catch {
    return res.status(400).json({ success: false, message: 'Unable to delete this user.' });
  }
};
