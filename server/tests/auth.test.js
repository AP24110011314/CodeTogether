import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

describe('Auth API', () => {
  const testUser = {
    name: 'Alice Developer',
    email: 'alice@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [testUser.email, 'bob@example.com'] } });
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: { $in: [testUser.email, 'bob@example.com'] } });
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns user info + accessToken + sets refresh cookie', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user.avatarColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(res.body.accessToken).toBeDefined();

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('rejects duplicate email with 409', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('rejects short passwords (< 8 characters) with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid email formats with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('logs in with correct credentials and returns accessToken + refresh cookie', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.accessToken).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('rejects incorrect password with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects non-existent email with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user with valid Bearer token', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      const token = regRes.body.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('rejects request without token with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid or tampered token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/refresh and /api/auth/logout', () => {
    it('refreshes accessToken and rotates refresh token cookie', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      const cookies = regRes.headers['set-cookie'];
      const rawCookie = cookies.find((c) => c.startsWith('refreshToken=')).split(';')[0];

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [rawCookie]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();

      const newCookies = refreshRes.headers['set-cookie'];
      expect(newCookies).toBeDefined();
      const newCookie = newCookies.find((c) => c.startsWith('refreshToken=')).split(';')[0];
      expect(newCookie).toBeDefined();
    });

    it('rejects refresh without cookie with 401', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('logs out and revokes refresh session', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      const cookies = regRes.headers['set-cookie'];
      const rawCookie = cookies.find((c) => c.startsWith('refreshToken=')).split(';')[0];

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [rawCookie]);

      expect(logoutRes.status).toBe(204);

      // Now trying to refresh with old cookie must fail
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [rawCookie]);

      expect(refreshRes.status).toBe(401);
    });
  });
});
