import mongoose from 'mongoose';

const executionRunSchema = new mongoose.Schema(
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
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    stdin: {
      type: String,
      default: '',
      maxlength: 10240, // 10 KB limit from doc 04
    },
    stdout: {
      type: String,
      default: '',
    },
    stderr: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'queued',
        'running',
        'success',
        'error',
        'timeout',
        'memory',
        'rejected',
      ],
      required: true,
    },
    exitCode: {
      type: Number,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    truncated: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index for chronological history queries per room
executionRunSchema.index({ roomId: 1, createdAt: -1 });

export const ExecutionRun = mongoose.model('ExecutionRun', executionRunSchema);
