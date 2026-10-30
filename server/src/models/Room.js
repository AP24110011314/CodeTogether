import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      default: 'javascript',
      trim: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    defaultRole: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'editor',
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    inviteToken: {
      type: String,
      default: null,
    },
    viewToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

roomSchema.index({ 'members.userId': 1 });

export const Room = mongoose.model('Room', roomSchema);

