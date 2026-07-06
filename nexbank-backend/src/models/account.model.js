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
      match: [/^\d{8}$/, 'Account number must be 8 digits'],
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      match: [/^NEX00\d{4}$/, 'IFSC code must be in format NEX00XXXX'],
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

const Account = mongoose.model('Account', accountSchema);

export default Account;
