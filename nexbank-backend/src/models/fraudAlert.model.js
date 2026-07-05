import mongoose from 'mongoose';

const { Schema } = mongoose;

const fraudAlertSchema = new Schema(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Fraud reason is required'],
      trim: true,
    },
    ruleTriggered: {
      type: String,
      enum: ['HIGH_AMOUNT', 'VELOCITY', 'ODD_HOURS', 'NEW_BENEFICIARY', 'ROUND_AMOUNT', 'MULTIPLE'],
      required: [true, 'Rule triggered is required'],
    },
    fraudScore: {
      type: Number,
      required: [true, 'Fraud score is required'],
      min: 0,
      max: 100,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'cleared', 'blocked'],
      default: 'pending',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

fraudAlertSchema.index({ status: 1, createdAt: -1 });
fraudAlertSchema.index({ userId: 1, status: 1 });

const FraudAlert = mongoose.model('FraudAlert', fraudAlertSchema);

export default FraudAlert;
