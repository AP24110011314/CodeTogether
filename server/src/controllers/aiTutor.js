import { generateTutorReply } from '../services/aiTutor.js';

export async function handleAiTutorChat(req, res, next) {
  try {
    const { message, history, context } = req.body;

    const result = await generateTutorReply({
      message,
      history,
      context,
    });

    return res.status(200).json({
      reply: result.reply,
      model: result.model,
    });
  } catch (error) {
    next(error);
  }
}
