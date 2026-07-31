import Account from '../models/account.model.js';
import Beneficiary from '../models/beneficiary.model.js';
import Transaction from '../models/transaction.model.js';
import User from '../models/user.model.js';

const generateTxnId = () => `NXTXN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

const statementRanges = {
  last_7_days: 7,
  last_1_month: 1,
  last_3_months: 3,
  last_6_months: 6,
};

const pdfText = (value) => String(value ?? '').replace(/[^\x20-\x7E]/g, ' ').replace(/[\\()]/g, '\\$&');

const buildStatementPdf = ({ account, accountHolderName, transactions, startDate, endDate, userId }) => {
  const rowsPerPage = 19;
  const rowGroups = Array.from({ length: Math.max(1, Math.ceil(transactions.length / rowsPerPage)) }, (_, index) =>
    transactions.slice(index * rowsPerPage, (index + 1) * rowsPerPage),
  );
  const pageCount = rowGroups.length;
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${rowGroups.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pageCount} >>`];

  rowGroups.forEach((rows, pageIndex) => {
    const contentId = 4 + pageIndex * 2;
    const lines = [
      'BT /F1 20 Tf 48 795 Td (NEXBANK) Tj ET',
      'BT /F1 10 Tf 48 775 Td (ACCOUNT STATEMENT) Tj ET',
      `BT /F1 9 Tf 370 795 Td (Generated On: ${pdfText(new Date().toLocaleDateString('en-IN'))}) Tj ET`,
      `BT /F1 9 Tf 48 748 Td (Account: ${pdfText(account.accountNumber)}   |   IFSC: ${pdfText(account.ifscCode)}   |   Type: ${pdfText(account.type)}) Tj ET`,
      `BT /F1 9 Tf 48 730 Td (Account Holder: ${pdfText(accountHolderName)}) Tj ET`,
      `BT /F1 9 Tf 48 712 Td (Statement period: ${pdfText(startDate.toLocaleDateString('en-IN'))} - ${pdfText(endDate.toLocaleDateString('en-IN'))}) Tj ET`,
      '0.1 0.55 0.5 rg 48 686 516 1 re f',
      'BT /F1 8 Tf 48 673 Td (DATE) Tj 72 0 Td (REFERENCE) Tj 150 0 Td (NOTE) Tj 125 0 Td (TRANSACTION TYPE) Tj 90 0 Td (AMOUNT) Tj ET',
    ];

    rows.forEach((transaction, index) => {
      const y = 652 - index * 27;
      const isCredit = String(transaction.toUserId) === String(userId);
      const direction = isCredit ? 'CR' : 'DR';
      const date = new Date(transaction.createdAt).toLocaleDateString('en-IN');
      const reference = transaction.txnId || '-';
      const defaultDescription = `${transaction.transferMode} transfer`;
      const note = transaction.description && transaction.description !== defaultDescription ? transaction.description.slice(0, 18) : '-';
      const transactionType = transaction.transferMode || transaction.type || '-';
      const amount = `INR ${Number(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${direction}`;
      lines.push(`BT /F1 8 Tf 48 ${y} Td (${pdfText(date)}) Tj 72 0 Td (${pdfText(reference)}) Tj 150 0 Td (${pdfText(note)}) Tj 125 0 Td (${pdfText(transactionType)}) Tj 90 0 Td (${pdfText(amount)}) Tj ET`);
      lines.push(`0.78 G 48 ${y - 8} m 564 ${y - 8} l S`);
    });

    if (!rows.length) {
      lines.push('BT /F1 10 Tf 48 642 Td (No transactions were recorded for this period.) Tj ET');
    }
    lines.push(`BT /F1 8 Tf 48 48 Td (NexBank account statement - Page ${pageIndex + 1} of ${pageCount}) Tj ET`);
    const content = lines.join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
};

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

export const downloadStatement = async (req, res) => {
  try {
    const { range, startDate: customStartDate, endDate: customEndDate } = req.body;
    let startDate;
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (range === 'custom') {
      startDate = new Date(`${customStartDate}T00:00:00`);
      endDate = new Date(`${customEndDate}T23:59:59.999`);
      if (!customStartDate || !customEndDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
        return res.status(400).json({ success: false, message: 'Please provide a valid start and end date.' });
      }
    } else if (statementRanges[range]) {
      startDate = new Date();
      if (range === 'last_7_days') {
        startDate.setDate(startDate.getDate() - statementRanges[range]);
      } else {
        startDate.setMonth(startDate.getMonth() - statementRanges[range]);
      }
      startDate.setHours(0, 0, 0, 0);
    } else {
      return res.status(400).json({ success: false, message: 'Please select a valid statement period.' });
    }

    const [account, accountHolder, transactions] = await Promise.all([
      Account.findOne({ userId: req.user.userId, isActive: true }),
      User.findById(req.user.userId).select('firstName lastName'),
      Transaction.find({
        $or: [{ fromUserId: req.user.userId }, { toUserId: req.user.userId }],
        createdAt: { $gte: startDate, $lte: endDate },
      }).sort({ createdAt: -1 }),
    ]);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Active account not found.' });
    }

    const accountHolderName = `${accountHolder?.firstName || ''} ${accountHolder?.lastName || ''}`.trim() || 'NexBank Customer';
    const pdf = buildStatementPdf({ account, accountHolderName, transactions, startDate, endDate, userId: req.user.userId });
    const filename = `nexbank-statement-${startDate.toISOString().slice(0, 10)}-to-${endDate.toISOString().slice(0, 10)}.pdf`;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': pdf.length });
    return res.status(200).send(pdf);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to generate your statement.' });
  }
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
