import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

describe('AI Tutor API (POST /api/ai-tutor/chat)', () => {
  let authToken;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: 'aitutor_test@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'AI Learner',
      email: 'aitutor_test@example.com',
      password: 'password123',
    });
    authToken = res.body.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'aitutor_test@example.com' });
    await disconnectDB();
  });

  it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/ai-tutor/chat')
      .send({ message: 'Can you explain binary search?' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects empty message with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/ai-tutor/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects excessively large message with 400 VALIDATION_ERROR', async () => {
    const hugeMessage = 'A'.repeat(9000);
    const res = await request(app)
      .post('/api/ai-tutor/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: hugeMessage });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns an intelligent tutor response for a valid prompt', async () => {
    const res = await request(app)
      .post('/api/ai-tutor/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'In one sentence, what is the time complexity of binary search?',
        context: {
          language: 'python',
          topic: 'Searching Algorithms',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body).toHaveProperty('model');
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(10);
  });
});
