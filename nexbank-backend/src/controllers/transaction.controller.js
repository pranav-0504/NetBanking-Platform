import Account from '../models/account.model.js';
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
};

const completeNeftTransaction = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction || transaction.status !== 'pending') {
    return;
  }

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
    const { accountNumber, ifscCode, amount, mode, note } = req.body;
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
      await Account.findByIdAndUpdate(fromAccount._id, {
        $inc: { balance: -transferAmount },
      });

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
