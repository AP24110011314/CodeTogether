import PQueue from 'p-queue';
import { env } from '../../config/env.js';
import logger from '../../utils/logger.js';

const concurrency = env.RUN_CONCURRENCY || 2;
const MAX_PENDING = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_RUNS_PER_WINDOW = 5;

const queue = new PQueue({ concurrency });

// In-memory sliding window: userId -> Array of timestamps
const userRunTimestamps = new Map();

// Set of userIds currently running or waiting in queue
const activeUsers = new Set();

export function checkEligibility(userId) {
  const userIdStr = String(userId);
  const now = Date.now();

  // 1. One concurrent run per user
  if (activeUsers.has(userIdStr)) {
    return {
      allowed: false,
      reason: 'rate_limit',
      message: 'You already have a run in progress or queued',
    };
  }

  // 2. Max pending queue capacity
  if (queue.size >= MAX_PENDING) {
    return {
      allowed: false,
      reason: 'queue_full',
      message: 'Execution queue is full. Please try again shortly',
    };
  }

  // 3. Sliding window: 5 runs / min
  const timestamps = userRunTimestamps.get(userIdStr) || [];
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = timestamps.filter((t) => t > windowStart);
  userRunTimestamps.set(userIdStr, recent);

  if (recent.length >= MAX_RUNS_PER_WINDOW) {
    return {
      allowed: false,
      reason: 'rate_limit',
      message: 'Rate limit exceeded: maximum 5 runs per minute',
    };
  }

  // Position is 1-indexed for the queue wait list
  const position = queue.size + 1;
  return { allowed: true, position };
}

export function enqueueRun({ userId, task, onStarted }) {
  const eligibility = checkEligibility(userId);
  if (!eligibility.allowed) {
    const error = new Error(eligibility.message);
    error.reason = eligibility.reason;
    throw error;
  }

  const userIdStr = String(userId);
  activeUsers.add(userIdStr);
  const position = eligibility.position;

  const promise = queue.add(async () => {
    // Record timestamp in rate limit window
    const now = Date.now();
    const timestamps = userRunTimestamps.get(userIdStr) || [];
    timestamps.push(now);
    userRunTimestamps.set(userIdStr, timestamps);

    if (typeof onStarted === 'function') {
      try {
        onStarted();
      } catch (err) {
        logger.error({ err }, 'Error in onStarted run callback');
      }
    }

    try {
      return await task();
    } finally {
      activeUsers.delete(userIdStr);
    }
  });

  return { promise, position };
}

export function getQueueStatus() {
  return {
    size: queue.size,
    pending: queue.pending,
    activeUsersCount: activeUsers.size,
  };
}

export function clearQueueRateLimits() {
  userRunTimestamps.clear();
  activeUsers.clear();
  queue.clear();
}
