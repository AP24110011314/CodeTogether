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

async function seed() {
  try {
    const sanitizedUri = env.MONGODB_URI.replace(/:[^:@]+@/, ':****@');
    console.log('Connecting to database:', sanitizedUri);
    await mongoose.connect(env.MONGODB_URI, { dbName: 'codetogether' });
    console.log('Connected to MongoDB database:', mongoose.connection.name);

    console.log('Cleaning existing demo data...');
    const demoEmails = [
      'alice@codetogether.dev',
      'bob@codetogether.dev',
      'charlie@codetogether.dev',
      'turing@codetogether.dev',
    ];
    const existingUsers = await User.find({ email: { $in: demoEmails } });
    const userIds = existingUsers.map((u) => u._id);

    await User.deleteMany({ email: { $in: demoEmails } });

    const demoSlugs = [
      'demo-workspace',
      'algorithms-101',
      'distributed-systems',
      'competitive-cpp',
    ];
    const existingRooms = await Room.find({ slug: { $in: demoSlugs } });
    for (const r of existingRooms) {
      await Document.deleteMany({ roomId: r._id });
      await Message.deleteMany({ roomId: r._id });
    }
    await Room.deleteMany({ slug: { $in: demoSlugs } });
    await Snippet.deleteMany({ userId: { $in: userIds } });

    console.log('Seeding demo users...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const alice = await User.create({
      name: 'Alice Developer',
      email: 'alice@codetogether.dev',
      passwordHash,
      avatarColor: '#4F6BF6',
    });

    const bob = await User.create({
      name: 'Bob Engineer',
      email: 'bob@codetogether.dev',
      passwordHash,
      avatarColor: '#14B8A6',
    });

    const charlie = await User.create({
      name: 'Charlie Student',
      email: 'charlie@codetogether.dev',
      passwordHash,
      avatarColor: '#F59E0B',
    });

    const turing = await User.create({
      name: 'Dr. Alan Turing',
      email: 'turing@codetogether.dev',
      passwordHash,
      avatarColor: '#8B5CF6',
    });

    console.log('Seeding rooms and collaborative documents...');

    // ROOM 1: Demo Workspace (Two Sum Algorithm)
    const room1Code = `// ========================================================
// CodeTogether Challenge: Two Sum (Hash Map Solution)
// Time Complexity: O(n) | Space Complexity: O(n)
// ========================================================

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test Run
const numbers = [2, 7, 11, 15];
const targetVal = 9;
const indices = twoSum(numbers, targetVal);

console.log('Input Array:', JSON.stringify(numbers));
console.log('Target Value:', targetVal);
console.log('Indices Solution:', JSON.stringify(indices));
console.log('Values:', numbers[indices[0]], '+', numbers[indices[1]], '=', targetVal);
`;

    const ydoc1 = new Y.Doc();
    const ytext1 = ydoc1.getText('monaco');
    ytext1.insert(0, room1Code);
    const yjsState1 = Buffer.from(Y.encodeStateAsUpdate(ydoc1));

    const room1 = await Room.create({
      name: 'Demo Collaborative Workspace',
      slug: 'demo-workspace',
      ownerId: alice._id,
      language: 'javascript',
      visibility: 'public',
      inviteToken: generateToken(),
      viewToken: generateToken(),
      members: [
        { userId: alice._id, role: 'owner' },
        { userId: bob._id, role: 'editor' },
        { userId: charlie._id, role: 'viewer' },
      ],
    });

    await Document.findOneAndUpdate(
      { roomId: room1._id },
      { yjsState: yjsState1 },
      { upsert: true }
    );

    // ROOM 2: LRU Cache (TypeScript)
    const room2Code = `// ========================================================
// Data Structures: LRU Cache (Least Recently Used)
// Time Complexity: O(1) Get & Put operations
// ========================================================

class DNode<K, V> {
  key: K;
  val: V;
  prev: DNode<K, V> | null = null;
  next: DNode<K, V> | null = null;
  constructor(key: K, val: V) {
    this.key = key;
    this.val = val;
  }
}

class LRUCache<K, V> {
  private capacity: number;
  private map = new Map<K, DNode<K, V>>();
  private head: DNode<K, V>;
  private tail: DNode<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.head = new DNode<any, any>(null, null);
    this.tail = new DNode<any, any>(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | -1 {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key)!;
    this.moveToHead(node);
    return node.val;
  }

  put(key: K, val: V): void {
    if (this.map.has(key)) {
      const node = this.map.get(key)!;
      node.val = val;
      this.moveToHead(node);
      return;
    }
    if (this.map.size >= this.capacity) {
      const lru = this.tail.prev!;
      this.removeNode(lru);
      this.map.delete(lru.key);
    }
    const newNode = new DNode(key, val);
    this.map.set(key, newNode);
    this.addNode(newNode);
  }

  private addNode(node: DNode<K, V>) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: DNode<K, V>) {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private moveToHead(node: DNode<K, V>) {
    this.removeNode(node);
    this.addNode(node);
  }
}

const cache = new LRUCache<number, string>(2);
cache.put(1, 'Database Record A');
cache.put(2, 'Database Record B');
console.log('Get 1:', cache.get(1)); // returns Record A
cache.put(3, 'Database Record C');  // evicts key 2
console.log('Get 2 (evicted):', cache.get(2)); // returns -1
console.log('Get 3:', cache.get(3)); // returns Record C
`;

    const ydoc2 = new Y.Doc();
    const ytext2 = ydoc2.getText('monaco');
    ytext2.insert(0, room2Code);
    const yjsState2 = Buffer.from(Y.encodeStateAsUpdate(ydoc2));

    const room2 = await Room.create({
      name: 'Algorithms 101: LRU Cache Lab',
      slug: 'algorithms-101',
      ownerId: turing._id,
      language: 'typescript',
      visibility: 'public',
      inviteToken: generateToken(),
      viewToken: generateToken(),
      members: [
        { userId: turing._id, role: 'owner' },
        { userId: alice._id, role: 'editor' },
        { userId: bob._id, role: 'editor' },
        { userId: charlie._id, role: 'editor' },
      ],
    });

    await Document.findOneAndUpdate(
      { roomId: room2._id },
      { yjsState: yjsState2 },
      { upsert: true }
    );

    // ROOM 3: Distributed Systems Lab (Python)
    const room3Code = `# ========================================================
# Distributed Systems: Raft Leader Election Simulation
# ========================================================
import time
import random

class RaftNode:
    def __init__(self, node_id, cluster_size):
        self.node_id = node_id
        self.cluster_size = cluster_size
        self.state = 'FOLLOWER'
        self.current_term = 0
        self.voted_for = None
        self.votes_received = 0

    def start_election(self):
        self.current_term += 1
        self.state = 'CANDIDATE'
        self.voted_for = self.node_id
        self.votes_received = 1
        print(f"[Node {self.node_id}] Started election for Term {self.current_term}")

        # Simulate votes from other nodes
        for peer_id in range(self.cluster_size):
            if peer_id != self.node_id and random.random() > 0.3:
                self.votes_received += 1

        majority = (self.cluster_size // 2) + 1
        if self.votes_received >= majority:
            self.state = 'LEADER'
            print(f"✨ [Node {self.node_id}] WON election with {self.votes_received}/{self.cluster_size} votes! Became LEADER.")
        else:
            self.state = 'FOLLOWER'
            print(f"[Node {self.node_id}] Election split. Back to FOLLOWER.")

cluster_nodes = [RaftNode(i, 5) for i in range(5)]
candidate = cluster_nodes[2]
candidate.start_election()
`;

    const ydoc3 = new Y.Doc();
    const ytext3 = ydoc3.getText('monaco');
    ytext3.insert(0, room3Code);
    const yjsState3 = Buffer.from(Y.encodeStateAsUpdate(ydoc3));

    const room3 = await Room.create({
      name: 'Distributed Systems: Raft Consensus Lab',
      slug: 'distributed-systems',
      ownerId: bob._id,
      language: 'python',
      visibility: 'public',
      inviteToken: generateToken(),
      viewToken: generateToken(),
      members: [
        { userId: bob._id, role: 'owner' },
        { userId: alice._id, role: 'editor' },
        { userId: turing._id, role: 'editor' },
      ],
    });

    await Document.findOneAndUpdate(
      { roomId: room3._id },
      { yjsState: yjsState3 },
      { upsert: true }
    );

    // ROOM 4: Dijkstra Algorithm (C++)
    const room4Code = `// ========================================================
// Competitive Programming: Dijkstra Shortest Path Algorithm
// Time Complexity: O((V + E) log V)
// ========================================================
#include <iostream>
#include <vector>
#include <queue>

using namespace std;

typedef pair<int, int> pii; // {distance, node}

void dijkstra(int start, int n, const vector<vector<pii>>& adj) {
    vector<int> dist(n, 1e9);
    priority_queue<pii, vector<pii>, greater<pii>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue;

        for (auto& edge : adj[u]) {
            int v = edge.first;
            int weight = edge.second;
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }

    cout << "Shortest distances from source node " << start << ":\\n";
    for (int i = 0; i < n; ++i) {
        cout << "Node " << i << " -> Distance: " << dist[i] << "\\n";
    }
}

int main() {
    int n = 5;
    vector<vector<pii>> adj(n);
    adj[0].push_back({1, 4});
    adj[0].push_back({2, 1});
    adj[2].push_back({1, 2});
    adj[1].push_back({3, 1});
    adj[2].push_back({3, 5});
    adj[3].push_back({4, 3});

    dijkstra(0, n, adj);
    return 0;
}
`;

    const ydoc4 = new Y.Doc();
    const ytext4 = ydoc4.getText('monaco');
    ytext4.insert(0, room4Code);
    const yjsState4 = Buffer.from(Y.encodeStateAsUpdate(ydoc4));

    const room4 = await Room.create({
      name: 'Competitive Programming: Graph Algorithms',
      slug: 'competitive-cpp',
      ownerId: alice._id,
      language: 'cpp',
      visibility: 'public',
      inviteToken: generateToken(),
      viewToken: generateToken(),
      members: [
        { userId: alice._id, role: 'owner' },
        { userId: bob._id, role: 'editor' },
        { userId: charlie._id, role: 'editor' },
      ],
    });

    await Document.findOneAndUpdate(
      { roomId: room4._id },
      { yjsState: yjsState4 },
      { upsert: true }
    );

    console.log('Seeding chat messages...');
    await Message.create([
      {
        roomId: room1._id,
        userId: alice._id,
        userName: 'Alice Developer',
        text: 'Welcome team! Let’s review the twoSum solution. Notice how the Map achieves linear O(n) runtime.',
        color: '#4F6BF6',
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        roomId: room1._id,
        userId: bob._id,
        userName: 'Bob Engineer',
        text: 'Clean implementation! Complement lookup is O(1) average. We should test duplicate numbers.',
        color: '#14B8A6',
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        roomId: room1._id,
        userId: charlie._id,
        userName: 'Charlie Student',
        text: 'Running it now with Cmd+Enter! Output matches the expected index pairs perfectly.',
        color: '#F59E0B',
        createdAt: new Date(Date.now() - 600000),
      },
    ]);

    await Message.create([
      {
        roomId: room2._id,
        userId: turing._id,
        userName: 'Dr. Alan Turing',
        text: 'Good morning class. Today we implement an LRU cache using a doubly linked list + hash map.',
        color: '#8B5CF6',
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        roomId: room2._id,
        userId: alice._id,
        userName: 'Alice Developer',
        text: 'I added the dummy head and tail sentinel nodes to simplify boundary pointer operations.',
        color: '#4F6BF6',
        createdAt: new Date(Date.now() - 3600000),
      },
    ]);

    console.log('Seeding snippet library...');
    await Snippet.create([
      {
        userId: alice._id,
        title: 'Binary Search (Iterative)',
        language: 'javascript',
        code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
        tags: ['binary-search', 'algorithms', 'divide-and-conquer'],
      },
      {
        userId: alice._id,
        title: 'QuickSort with Hoare Partitioning',
        language: 'javascript',
        code: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const p = partition(arr, low, high);
    quickSort(arr, low, p);
    quickSort(arr, p + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[Math.floor((low + high) / 2)];
  let i = low - 1;
  let j = high + 1;
  while (true) {
    do { i++; } while (arr[i] < pivot);
    do { j--; } while (arr[j] > pivot);
    if (i >= j) return j;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}`,
        tags: ['sorting', 'quicksort', 'algorithms'],
      },
      {
        userId: bob._id,
        title: 'Fast Exponentiation O(log n)',
        language: 'python',
        code: `def power(base, exp):
    res = 1
    while exp > 0:
        if exp % 2 == 1:
            res *= base
        base *= base
        exp //= 2
    return res

print("2^10 =", power(2, 10))`,
        tags: ['math', 'algorithms', 'fast-power', 'python'],
      },
      {
        userId: bob._id,
        title: 'Debounce Utility Function',
        language: 'typescript',
        code: `function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}`,
        tags: ['utility', 'frontend', 'typescript', 'debounce'],
      },
      {
        userId: charlie._id,
        title: 'Valid Parentheses Stack Check',
        language: 'javascript',
        code: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
        tags: ['stack', 'string', 'leetcode'],
      },
      {
        userId: turing._id,
        title: 'Merge Two Sorted Linked Lists',
        language: 'javascript',
        code: `function mergeTwoLists(l1, l2) {
  const dummy = { val: 0, next: null };
  let current = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) {
      current.next = l1;
      l1 = l1.next;
    } else {
      current.next = l2;
      l2 = l2.next;
    }
    current = current.next;
  }
  current.next = l1 || l2;
  return dummy.next;
}`,
        tags: ['linked-list', 'recursion', 'data-structures'],
      },
    ]);

    console.log(`
======================================================
  ✅ CodeTogether Seed Completed Successfully!
======================================================
Database: MongoDB Atlas (${mongoose.connection.name})

Demo Accounts (Password: password123):
  1. Alice (Owner):       alice@codetogether.dev
  2. Bob   (Editor):      bob@codetogether.dev
  3. Charlie (Student):   charlie@codetogether.dev
  4. Dr. Turing (Mentor): turing@codetogether.dev

Collaborative Rooms:
  1. Demo Workspace:       http://localhost:5173/room/demo-workspace
  2. LRU Cache Lab:        http://localhost:5173/room/algorithms-101
  3. Raft Consensus Lab:   http://localhost:5173/room/distributed-systems
  4. Graph Algorithms:     http://localhost:5173/room/competitive-cpp
======================================================
`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed script error:', err);
    process.exit(1);
  }
}

seed();
