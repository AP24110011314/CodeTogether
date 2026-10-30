import { execSync } from 'child_process';
import logger from '../../utils/logger.js';

export const LANGUAGES = {
  javascript: {
    name: 'JavaScript (Node.js)',
    file: 'main.js',
    run: ['node', 'main.js'],
    probe: ['node'],
  },
  python: {
    name: 'Python 3',
    file: 'main.py',
    run: ['python3', 'main.py'],
    probe: ['python3'],
  },
  typescript: {
    name: 'TypeScript',
    file: 'main.ts',
    run: ['npx', '--no-install', 'tsx', 'main.ts'],
    probe: ['node', 'npx'],
  },
  c: {
    name: 'C (GCC)',
    file: 'main.c',
    compile: ['gcc', 'main.c', '-o', 'main'],
    run: ['./main'],
    probe: ['gcc'],
  },
  cpp: {
    name: 'C++ (G++)',
    file: 'main.cpp',
    compile: ['g++', 'main.cpp', '-o', 'main'],
    run: ['./main'],
    probe: ['g++'],
  },
  java: {
    name: 'Java',
    file: 'Main.java',
    compile: ['javac', 'Main.java'],
    run: ['java', 'Main'],
    probe: ['javac', 'java'],
  },
  go: {
    name: 'Go',
    file: 'main.go',
    run: ['go', 'run', 'main.go'],
    probe: ['go'],
  },
};

let availableLanguagesCache = null;

export function checkBinaryAvailable(binary) {
  try {
    execSync(`which ${binary}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function probeLanguages() {
  const available = [];

  for (const [key, config] of Object.entries(LANGUAGES)) {
    const isSupported = config.probe.every((bin) => checkBinaryAvailable(bin));
    if (isSupported) {
      available.push({
        id: key,
        name: config.name,
      });
    }
  }

  availableLanguagesCache = available;
  logger.info(
    { count: available.length, languages: available.map((l) => l.id) },
    'Sandbox probed available language runtimes'
  );
  return available;
}

export function getAvailableLanguages() {
  if (!availableLanguagesCache) {
    probeLanguages();
  }
  return availableLanguagesCache;
}

export function isLanguageAvailable(langId) {
  const available = getAvailableLanguages();
  return available.some((l) => l.id === langId.toLowerCase());
}

export function validateCode(code) {
  if (typeof code !== 'string') {
    return { valid: false, error: 'Code must be a string' };
  }

  if (code.length > 100 * 1024) {
    return { valid: false, error: 'Code exceeds 100 KB limit' };
  }

  return { valid: true };
}

