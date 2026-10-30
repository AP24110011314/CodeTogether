import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system messages
    },
    type: {
      type: String,
      enum: ['user', 'system'],
      default: 'user',
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for fast chronological and paginated history queries
messageSchema.index({ roomId: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
