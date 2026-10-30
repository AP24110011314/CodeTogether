import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      unique: true,
      index: true,
    },
    yjsState: {
      type: Buffer,
      default: () => Buffer.alloc(0),
    },
  },
  {
    timestamps: true,
  }
);

export const Document = mongoose.model('Document', documentSchema);
