import mongoose from 'mongoose';

const { Schema } = mongoose;

const accountSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      unique: true,
      trim: true,
      match: [/^NX-\d{8}$/, 'Account number must be in format NX-XXXXXXXX'],
    },
    type: {
      type: String,
      enum: ['savings', 'current', 'fd'],
      required: [true, 'Account type is required'],
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    fdMaturityDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

accountSchema.index({ userId: 1, type: 1 });
accountSchema.index({ accountNumber: 1 });

const Account = mongoose.model('Account', accountSchema);

export default Account;
