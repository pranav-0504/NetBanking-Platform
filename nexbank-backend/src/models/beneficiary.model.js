import mongoose from 'mongoose';

const { Schema } = mongoose;

const beneficiarySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    nickName: {
      type: String,
      required: [true, 'Nickname is required'],
      trim: true,
      maxlength: [50, 'Nickname cannot exceed 50 characters'],
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
      match: [/^NX-\d{8}$/, 'Account number must be in format NX-XXXXXXXX'],
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
      maxlength: [100, 'Account holder name cannot exceed 100 characters'],
    },
    bankName: {
      type: String,
      default: 'NexBank',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

beneficiarySchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);

export default Beneficiary;
