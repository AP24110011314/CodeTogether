import { Snippet } from '../models/Snippet.js';

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export async function createSnippet(req, res, next) {
  try {
    const { title, language, code, tags } = req.body;
    const userId = req.user.id;

    const cleanTags = Array.isArray(tags)
      ? Array.from(new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))).slice(0, 10)
      : [];

    const snippet = await Snippet.create({
      userId,
      title: title.trim(),
      language: (language || 'javascript').toLowerCase().trim(),
      code,
      tags: cleanTags,
    });

    return res.status(201).json({ snippet });
  } catch (error) {
    next(error);
  }
}

export async function getSnippets(req, res, next) {
  try {
    const { q, language, tag, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const filter = { userId };

    if (language) {
      filter.language = language.toLowerCase().trim();
    }

    if (tag) {
      filter.tags = tag.toLowerCase().trim();
    }

    if (q && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: regex }, { tags: regex }, { code: regex }];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [snippets, total] = await Promise.all([
      Snippet.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
      Snippet.countDocuments(filter),
    ]);

    return res.status(200).json({
      snippets,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSnippetById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const snippet = await Snippet.findById(id);
    if (!snippet) {
      return res.status(404).json({
        error: {
          code: 'SNIPPET_NOT_FOUND',
          message: 'Snippet not found',
        },
      });
    }

    // Ownership IDOR guard
    if (snippet.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this snippet',
        },
      });
    }

    return res.status(200).json({ snippet });
  } catch (error) {
    next(error);
  }
}

export async function updateSnippet(req, res, next) {
  try {
    const { id } = req.params;
    const { title, language, code, tags } = req.body;
    const userId = req.user.id;

    const snippet = await Snippet.findById(id);
    if (!snippet) {
      return res.status(404).json({
        error: {
          code: 'SNIPPET_NOT_FOUND',
          message: 'Snippet not found',
        },
      });
    }

    // Ownership IDOR guard
    if (snippet.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this snippet',
        },
      });
    }

    if (title !== undefined) snippet.title = title.trim();
    if (language !== undefined) snippet.language = language.toLowerCase().trim();
    if (code !== undefined) snippet.code = code;
    if (tags !== undefined) {
      snippet.tags = Array.isArray(tags)
        ? Array.from(new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))).slice(0, 10)
        : [];
    }

    await snippet.save();

    return res.status(200).json({ snippet });
  } catch (error) {
    next(error);
  }
}

export async function deleteSnippet(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const snippet = await Snippet.findById(id);
    if (!snippet) {
      return res.status(404).json({
        error: {
          code: 'SNIPPET_NOT_FOUND',
          message: 'Snippet not found',
        },
      });
    }

    // Ownership IDOR guard
    if (snippet.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this snippet',
        },
      });
    }

    await Snippet.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    next(error);
  }
}

