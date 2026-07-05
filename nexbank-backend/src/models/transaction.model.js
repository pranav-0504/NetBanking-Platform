import mongoose from 'mongoose';

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    txnId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      trim: true,
    },
    fromAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Source account is required'],
      index: true,
    },
    toAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Destination account is required'],
      index: true,
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Source user is required'],
      index: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Destination user is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    charges: {
      type: Number,
      default: 0,
      min: [0, 'Charges cannot be negative'],
    },
    transferMode: {
      type: String,
      enum: ['IMPS', 'NEFT', 'RTGS'],
      required: [true, 'Transfer mode is required'],
    },
    type: {
      type: String,
      enum: ['transfer', 'credit', 'debit', 'fee'],
      default: 'transfer',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'blocked'],
      default: 'pending',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

transactionSchema.index({ fromUserId: 1, createdAt: -1 });
transactionSchema.index({ toUserId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, transferMode: 1 });
transactionSchema.index({ txnId: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
