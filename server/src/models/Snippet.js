import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    language: {
      type: String,
      required: true,
      trim: true,
      default: 'javascript',
    },
    code: {
      type: String,
      required: true,
      maxlength: 102400, // 100 KB limit from doc 04 and doc 09
    },
    tags: {
      type: [String],
      validate: [
        (val) => Array.isArray(val) && val.length <= 10,
        'Cannot exceed 10 tags',
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user snippet list sorted by latest update
snippetSchema.index({ userId: 1, updatedAt: -1 });

// Text index for search across title and tags (language_override: 'none' prevents MongoDB treating code language as natural language stemming)
snippetSchema.index({ title: 'text', tags: 'text' }, { default_language: 'none', language_override: 'none' });

export const Snippet = mongoose.model('Snippet', snippetSchema);
