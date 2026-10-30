import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Snippet } from '../src/models/Snippet.js';

describe('Phase 7 — Saved Snippets CRUD & IDOR Security', () => {
  let userA, tokenA;
  let userB, tokenB;

  beforeAll(async () => {
    await connectDB();
    await Snippet.syncIndexes();
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: ['snip_a@test.com', 'snip_b@test.com'] },
    });
    await Snippet.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({
      email: { $in: ['snip_a@test.com', 'snip_b@test.com'] },
    });
    await Snippet.deleteMany({});

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Snippet User A',
      email: 'snip_a@test.com',
      password: 'password123',
    });
    userA = resA.body.user;
    tokenA = resA.body.accessToken;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Snippet User B',
      email: 'snip_b@test.com',
      password: 'password123',
    });
    userB = resB.body.user;
    tokenB = resB.body.accessToken;
  });

  describe('POST /api/snippets', () => {
    it('returns 401 unauthenticated when no token is provided', async () => {
      const res = await request(app).post('/api/snippets').send({
        title: 'Binary Search',
        code: 'function binarySearch() {}',
      });
      expect(res.status).toBe(401);
    });

    it('creates a snippet successfully with valid input', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Binary Search Algorithm',
          language: 'javascript',
          code: 'function binarySearch(arr, target) { return -1; }',
          tags: ['algorithm', 'search', 'binary'],
        });

      expect(res.status).toBe(201);
      expect(res.body.snippet).toBeDefined();
      expect(res.body.snippet.title).toBe('Binary Search Algorithm');
      expect(res.body.snippet.userId).toBe(userA.id);
      expect(res.body.snippet.tags).toEqual(['algorithm', 'search', 'binary']);
    });

    it('rejects snippet with title exceeding 100 characters', async () => {
      const longTitle = 'a'.repeat(101);
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: longTitle,
          code: 'const x = 1;',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects snippet with code exceeding 100 KB limit', async () => {
      const largeCode = 'x'.repeat(102401);
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Oversized Code',
          code: largeCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects snippet with more than 10 tags', async () => {
      const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Too Many Tags',
          code: 'const x = 1;',
          tags,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/snippets (IDOR Protection & Filters)', () => {
    beforeEach(async () => {
      // User A creates 3 snippets
      await Snippet.create([
        {
          userId: userA.id,
          title: 'QuickSort in Python',
          language: 'python',
          code: 'def quicksort(arr): return arr',
          tags: ['sorting', 'algorithm'],
        },
        {
          userId: userA.id,
          title: 'MergeSort in JS',
          language: 'javascript',
          code: 'function mergeSort() {}',
          tags: ['sorting'],
        },
        {
          userId: userA.id,
          title: 'React Hook Utility',
          language: 'typescript',
          code: 'export function useDebounce() {}',
          tags: ['react', 'hook'],
        },
      ]);

      // User B creates 1 snippet
      await Snippet.create({
        userId: userB.id,
        title: 'User B Secret Algorithm',
        language: 'python',
        code: 'def secret(): pass',
        tags: ['secret'],
      });
    });

    it('only returns own snippets (User B cannot see User A snippets)', async () => {
      const resB = await request(app)
        .get('/api/snippets')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.snippets).toHaveLength(1);
      expect(resB.body.snippets[0].title).toBe('User B Secret Algorithm');

      const resA = await request(app)
        .get('/api/snippets')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.snippets).toHaveLength(3);
      expect(resA.body.snippets.every((s) => s.userId.toString() === userA.id)).toBe(true);
    });

    it('filters by search query q across title, tags, and code', async () => {
      const res = await request(app)
        .get('/api/snippets?q=QuickSort')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.snippets).toHaveLength(1);
      expect(res.body.snippets[0].title).toBe('QuickSort in Python');
    });

    it('filters by language', async () => {
      const res = await request(app)
        .get('/api/snippets?language=python')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.snippets).toHaveLength(1);
      expect(res.body.snippets[0].language).toBe('python');
    });

    it('filters by tag', async () => {
      const res = await request(app)
        .get('/api/snippets?tag=sorting')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.snippets).toHaveLength(2);
    });

    it('paginates results', async () => {
      const res = await request(app)
        .get('/api/snippets?limit=2&page=1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.snippets).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.totalPages).toBe(2);
    });
  });

  describe('IDOR Single Resource Protection (GET, PATCH, DELETE)', () => {
    let snippetA;

    beforeEach(async () => {
      snippetA = await Snippet.create({
        userId: userA.id,
        title: 'User A Private Snippet',
        language: 'javascript',
        code: 'const a = 42;',
        tags: ['private'],
      });
    });

    it('allows owner to GET snippet by ID', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetA._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.snippet.title).toBe('User A Private Snippet');
    });

    it('blocks non-owner from GET snippet by ID with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows owner to PATCH snippet', async () => {
      const res = await request(app)
        .patch(`/api/snippets/${snippetA._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Updated Title',
          tags: ['updated'],
        });

      expect(res.status).toBe(200);
      expect(res.body.snippet.title).toBe('Updated Title');
      expect(res.body.snippet.tags).toEqual(['updated']);
    });

    it('blocks non-owner from PATCH snippet with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/snippets/${snippetA._id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks non-owner from DELETE snippet with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/snippets/${snippetA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');

      // Verify snippet still exists in DB
      const inDb = await Snippet.findById(snippetA._id);
      expect(inDb).not.toBeNull();
    });

    it('allows owner to DELETE snippet', async () => {
      const res = await request(app)
        .delete(`/api/snippets/${snippetA._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);

      const inDb = await Snippet.findById(snippetA._id);
      expect(inDb).toBeNull();
    });
  });

  describe('Acceptance Criterion: Session Persistence & Isolation', () => {
    it('snippet saved in one session appears after re-login; other users cannot access it', async () => {
      // 1. User A creates snippet
      const createRes = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Persistent Math Library',
          language: 'javascript',
          code: 'export const add = (a, b) => a + b;',
          tags: ['math', 'utils'],
        });
      expect(createRes.status).toBe(201);
      const snippetId = createRes.body.snippet._id;

      // 2. User A logs in again (new session token)
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'snip_a@test.com',
        password: 'password123',
      });
      expect(loginRes.status).toBe(200);
      const newTokenA = loginRes.body.accessToken;

      // 3. User A retrieves snippets with the new token: snippet is present
      const listRes = await request(app)
        .get('/api/snippets')
        .set('Authorization', `Bearer ${newTokenA}`);
      expect(listRes.status).toBe(200);
      const found = listRes.body.snippets.find((s) => s._id === snippetId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Persistent Math Library');

      // 4. User B cannot access snippet directly or in list
      const userBList = await request(app)
        .get('/api/snippets')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(userBList.body.snippets.some((s) => s._id === snippetId)).toBe(false);

      const userBDirect = await request(app)
        .get(`/api/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(userBDirect.status).toBe(403);
    });
  });
});
