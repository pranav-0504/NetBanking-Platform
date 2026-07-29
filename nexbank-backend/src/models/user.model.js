import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isMobileVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      default: null,
    },

    sessionExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;



// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });
// /**
//  * Return public user profile without sensitive fields.
//  * @returns {Object} Safe user object
//  */
// userSchema.methods.toPublicProfile = function toPublicProfile() {
//   return {
//     _id: this._id,
//     fullName: this.fullName,
//     email: this.email,
//     phone: this.phone,
//     role: this.role,
//     isVerified: this.isVerified,
//     isFrozen: this.isFrozen,
//     twoFactorEnabled: this.twoFactorEnabled,
//     createdAt: this.createdAt,
//   };
// };

