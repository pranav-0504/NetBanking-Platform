import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

/**
 * Return public user profile without sensitive fields.
 * @returns {Object} Safe user object
 */
userSchema.methods.toPublicProfile = function toPublicProfile() {
  return {
    _id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isVerified: this.isVerified,
    isFrozen: this.isFrozen,
    twoFactorEnabled: this.twoFactorEnabled,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
