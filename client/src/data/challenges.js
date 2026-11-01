export const CODING_CHALLENGES = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Hash Map',
    language: 'javascript',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    starterCode: `// Two Sum
// Return indices of the two numbers such that they add up to target.

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test cases
console.log('Test 1:', twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log('Test 2:', twoSum([3, 2, 4], 6));       // Expected: [1, 2]
console.log('Test 3:', twoSum([3, 3], 6));          // Expected: [0, 1]
`,
    hints: [
      'A brute force approach checks all pairs in O(n^2) time. Can we do it in a single pass?',
      'As you iterate through the array, calculate the complement (target - current number).',
      'Use a Hash Map to store numbers you have already visited and their indices.',
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    language: 'javascript',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    starterCode: `// Valid Parentheses
function isValid(s) {
  const stack = [];
  const map = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    }
  }

  return stack.length === 0;
}

// Test cases
console.log('Test "()":', isValid('()'));         // Expected: true
console.log('Test "()[]{}":', isValid('()[]{}')); // Expected: true
console.log('Test "(]":', isValid('(]'));         // Expected: false
console.log('Test "([)]":', isValid('([)]'));     // Expected: false
console.log('Test "{[]}":', isValid('{[]}'));     // Expected: true
`,
    hints: [
      'Think about what data structure naturally handles Last-In, First-Out (LIFO) matching.',
      'When you see an opening bracket, push it onto a Stack.',
      'When you see a closing bracket, check if the top of the stack matches its pair.',
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache Design',
    difficulty: 'Medium',
    category: 'Design & Linked List',
    language: 'javascript',
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:
- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
- int get(int key) Return the value of the key if the key exists, otherwise return -1.
- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions get and put must each run in O(1) average time complexity.`,
    starterCode: `// LRU Cache
class DNode {
  constructor(key, val) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new DNode(0, 0);
    this.tail = new DNode(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._remove(node);
    this._add(node);
    return node.val;
  }

  put(key, val) {
    if (this.map.has(key)) {
      this._remove(this.map.get(key));
    }
    const node = new DNode(key, val);
    this._add(node);
    this.map.set(key, node);

    if (this.map.size > this.capacity) {
      const lru = this.head.next;
      this._remove(lru);
      this.map.delete(lru.key);
    }
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _add(node) {
    node.prev = this.tail.prev;
    node.next = this.tail;
    this.tail.prev.next = node;
    this.tail.prev = node;
  }
}

// Test cases
const cache = new LRUCache(2);
cache.put(1, 100);
cache.put(2, 200);
console.log('Get 1:', cache.get(1)); // 100
cache.put(3, 300); // evicts key 2
console.log('Get 2:', cache.get(2)); // -1 (evicted)
console.log('Get 3:', cache.get(3)); // 300
`,
    hints: [
      'To achieve O(1) eviction, you need both fast random access and fast pointer removal.',
      'A Doubly Linked List allows O(1) node removal and addition at the ends.',
      'Combine a Hash Map (for O(1) key lookup) with a Doubly Linked List (for maintaining usage order).',
    ],
    timeComplexity: 'O(1) for both get and put',
    spaceComplexity: 'O(capacity)',
  },
  {
    id: 'fibonacci-dp',
    title: 'Fibonacci Sequence (Memoized)',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    language: 'python',
    description: `Compute the n-th Fibonacci number where F(0) = 0, F(1) = 1, and F(n) = F(n-1) + F(n-2) for n > 1.

Demonstrate how Dynamic Programming turns an exponential O(2^n) recursion into an optimal O(n) solution.`,
    starterCode: `# Fibonacci with Dynamic Programming (Memoization)
def fib_memo(n, memo=None):
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 0:
        return 0
    if n == 1:
        return 1

    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

# Test cases
for i in range(11):
    print(f"F({i}) = {fib_memo(i)}")

print("F(50) computed in sub-millisecond:", fib_memo(50))
`,
    hints: [
      'Naive recursion computes the same subproblems repeatedly, creating a binary tree of depth n with 2^n calls.',
      'Cache already computed results in a hash table or dictionary.',
      'Notice that F(50) computes instantly with memoization whereas naive recursion would hang.',
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
  {
    id: 'palindrome-check',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'Two Pointers',
    language: 'javascript',
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string s, return true if it is a palindrome, or false otherwise.`,
    starterCode: `// Valid Palindrome (Two Pointers)
function isPalindrome(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = clean.length - 1;

  while (left < right) {
    if (clean[left] !== clean[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}

// Test cases
console.log('Test 1:', isPalindrome("A man, a plan, a canal: Panama")); // true
console.log('Test 2:', isPalindrome("race a car")); // false
console.log('Test 3:', isPalindrome(" ")); // true
`,
    hints: [
      'Normalize the string first by lowercasing and stripping non-alphanumeric characters.',
      'Use two pointers starting at the beginning and the end, moving towards the middle.',
      'If characters at any pointer do not match, return false immediately.',
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
];

