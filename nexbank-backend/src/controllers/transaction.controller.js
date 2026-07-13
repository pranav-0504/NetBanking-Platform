import Account from '../models/account.model.js';
import Beneficiary from '../models/beneficiary.model.js';
import Notification from '../models/notification.model.js';
import Transaction from '../models/transaction.model.js';

const generateTxnId = () => `NXTXN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

const completeImpsTransaction = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction || transaction.status !== 'pending') {
    return;
  }

  await Account.findByIdAndUpdate(transaction.fromAccountId, {
    $inc: { balance: -transaction.amount },
  });
  await Account.findByIdAndUpdate(transaction.toAccountId, {
    $inc: { balance: transaction.amount },
  });

  transaction.status = 'completed';
  transaction.completedAt = new Date();
  await transaction.save();

  await Notification.create({
    userId: transaction.toUserId,
    title: 'NEFT transaction received',
    message: `NEFT transfer of INR ${transaction.amount} has been credited to your account.`,
    type: 'credit',
  });
};

const completeNeftTransaction = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction || transaction.status !== 'pending') {
    return;
  }

  const fromAccount = await Account.findById(transaction.fromAccountId);

  if (!fromAccount || fromAccount.balance < transaction.amount) {
    transaction.status = 'failed';
    transaction.description = `${transaction.description || 'NEFT transfer'} - failed due to insufficient balance at processing time`;
    await transaction.save();
    return;
  }

  await Account.findByIdAndUpdate(transaction.fromAccountId, {
    $inc: { balance: -transaction.amount },
  });
  await Account.findByIdAndUpdate(transaction.toAccountId, {
    $inc: { balance: transaction.amount },
  });

  transaction.status = 'completed';
  transaction.completedAt = new Date();
  await transaction.save();
};

export const listTransactions = async (req, res) => {
  const transactions = await Transaction.find({
    $or: [{ fromUserId: req.user.userId }, { toUserId: req.user.userId }],
  })
    .populate('fromAccountId', 'accountNumber ifscCode')
    .populate('toAccountId', 'accountNumber ifscCode')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: 'Transactions fetched successfully',
    data: transactions,
  });
};

export const transferFunds = async (req, res) => {
  try {
    const { beneficiaryId, amount, mode, note } = req.body;
    let { accountNumber, ifscCode } = req.body;
    const transferAmount = Number(amount);
    const transferMode = String(mode || '').toUpperCase();

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }

    if (!['IMPS', 'NEFT'].includes(transferMode)) {
      return res.status(400).json({
        success: false,
        message: 'Transfer mode must be IMPS or NEFT',
      });
    }

    if (beneficiaryId) {
      const beneficiary = await Beneficiary.findOne({
        _id: beneficiaryId,
        userId: req.user.userId,
      });

      if (!beneficiary) {
        return res.status(404).json({
          success: false,
          message: 'Beneficiary not found',
        });
      }

      accountNumber = beneficiary.accountNumber;
      ifscCode = beneficiary.ifscCode;
    }

    if (!accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary account and IFSC are required',
      });
    }

    const fromAccount = await Account.findOne({ userId: req.user.userId, isActive: true });
    const toAccount = await Account.findOne({ accountNumber, ifscCode, isActive: true });

    if (!fromAccount || !toAccount) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (fromAccount._id.equals(toAccount._id)) {
      return res.status(400).json({
        success: false,
        message: 'Self transfer is not allowed',
      });
    }

    if (fromAccount.balance < transferAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    const transaction = await Transaction.create({
      txnId: generateTxnId(),
      fromAccountId: fromAccount._id,
      toAccountId: toAccount._id,
      fromUserId: req.user.userId,
      toUserId: toAccount.userId,
      amount: transferAmount,
      transferMode,
      status: 'pending',
      description: note || `${transferMode} transfer`,
    });

    if (transferMode === 'IMPS') {
      await completeImpsTransaction(transaction._id);
    } else {
      setTimeout(() => {
        completeNeftTransaction(transaction._id).catch(() => undefined);
      }, 5 * 60 * 1000);
    }

    const updatedTransaction = await Transaction.findById(transaction._id);

    return res.status(201).json({
      success: true,
      message: transferMode === 'IMPS' ? 'Transfer completed successfully' : 'NEFT transfer scheduled',
      data: updatedTransaction,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
