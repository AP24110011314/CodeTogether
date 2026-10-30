import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as Y from 'yjs';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { Room } from './models/Room.js';
import { Document } from './models/Document.js';
import { Message } from './models/Message.js';
import { Snippet } from './models/Snippet.js';
import { generateToken } from './utils/slug.js';
import logger from './utils/logger.js';

async function seed() {
  try {
    console.log('Connecting to database:', env.MONGODB_URI);
    await mongoose.connect(env.MONGODB_URI);

    console.log('Cleaning existing demo data...');
    const demoEmails = [
      'alice@codetogether.dev',
      'bob@codetogether.dev',
      'charlie@codetogether.dev',
    ];
    const existingUsers = await User.find({ email: { $in: demoEmails } });
    const userIds = existingUsers.map((u) => u._id);

    await User.deleteMany({ email: { $in: demoEmails } });
    const existingRooms = await Room.find({ slug: 'demo-workspace' });
    for (const r of existingRooms) {
      await Document.deleteMany({ roomId: r._id });
      await Message.deleteMany({ roomId: r._id });
    }
    await Room.deleteMany({ slug: 'demo-workspace' });
    await Snippet.deleteMany({ userId: { $in: userIds } });

    console.log('Seeding demo users...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const alice = await User.create({
      name: 'Alice Developer',
      email: 'alice@codetogether.dev',
      passwordHash,
      avatarColor: '#8b5cf6',
    });

    const bob = await User.create({
      name: 'Bob Engineer',
      email: 'bob@codetogether.dev',
      passwordHash,
      avatarColor: '#10b981',
    });

    const charlie = await User.create({
      name: 'Charlie Reviewer',
      email: 'charlie@codetogether.dev',
      passwordHash,
      avatarColor: '#f59e0b',
    });

    console.log('Seeding sample collaborative room...');
    const inviteToken = generateToken();
    const viewToken = generateToken();

    const room = await Room.create({
      name: 'Demo Collaborative Workspace',
      slug: 'demo-workspace',
      ownerId: alice._id,
      language: 'javascript',
      visibility: 'public',
      defaultRole: 'editor',
      inviteToken,
      viewToken,
      members: [
        { userId: alice._id, role: 'owner', joinedAt: new Date() },
        { userId: bob._id, role: 'editor', joinedAt: new Date() },
        { userId: charlie._id, role: 'viewer', joinedAt: new Date() },
      ],
    });

    // Create initial Yjs Document
    const initialCode = `// Welcome to CodeTogether!
// Real-time collaborative workspace with Monaco, Yjs, and Sandboxed Execution.
// Press Cmd/Ctrl + Enter to execute this program!

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("=== CodeTogether Live Sandbox Demo ===");
console.log("Calculating first 10 Fibonacci numbers:");

for (let i = 0; i <= 10; i++) {
  console.log(\`  F(\${i}) = \${fibonacci(i)}\`);
}
`;

    const ydoc = new Y.Doc();
    ydoc.getText('monaco').insert(0, initialCode);
    const update = Y.encodeStateAsUpdate(ydoc);

    await Document.create({
      roomId: room._id,
      yjsState: Buffer.from(update),
    });

    console.log('Seeding demo chat messages...');
    await Message.create([
      {
        roomId: room._id,
        userId: null,
        type: 'system',
        text: 'Welcome to CodeTogether! The workspace is ready.',
      },
      {
        roomId: room._id,
        userId: alice._id,
        type: 'user',
        text: 'Hey team! Real-time code editing and execution are live.',
      },
      {
        roomId: room._id,
        userId: bob._id,
        type: 'user',
        text: 'Awesome! Pressing Cmd+Enter to run the Fibonacci sample.',
      },
    ]);

    console.log('Seeding demo snippets...');
    await Snippet.create([
      {
        userId: alice._id,
        title: 'Fibonacci Generator',
        description: 'Recursive Fibonacci function with demonstration loop',
        language: 'javascript',
        code: `function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}`,
        tags: ['math', 'algorithms', 'recursion'],
      },
      {
        userId: bob._id,
        title: 'Debounce Utility',
        description: 'Delays function execution until after wait milliseconds',
        language: 'javascript',
        code: `function debounce(func, wait) {\n  let timeout;\n  return function(...args) {\n    clearTimeout(timeout);\n    timeout = setTimeout(() => func.apply(this, args), wait);\n  };\n}`,
        tags: ['utility', 'helper'],
      },
    ]);

    console.log('\n======================================================');
    console.log('  ✅ CodeTogether Seed Completed Successfully!');
    console.log('======================================================');
    console.log('Demo Users (Password for all: password123):');
    console.log('  1. Alice (Owner):   alice@codetogether.dev');
    console.log('  2. Bob   (Editor):  bob@codetogether.dev');
    console.log('  3. Charlie (Viewer): charlie@codetogether.dev');
    console.log('\nDemo Room:');
    console.log('  Name: Demo Collaborative Workspace');
    console.log('  URL:  http://localhost:5173/room/demo-workspace');
    console.log('  View: http://localhost:5173/room/demo-workspace?view=' + viewToken);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

