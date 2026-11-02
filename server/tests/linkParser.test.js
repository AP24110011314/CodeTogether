import { describe, it, expect } from 'vitest';
import { parseClassLinkOrCode } from '../../client/src/lib/linkParser.js';

describe('Client Link & Code Parser (parseClassLinkOrCode)', () => {
  it('parses full URL with invite token', () => {
    const res = parseClassLinkOrCode('http://localhost:5173/room/python-lab?invite=secret123');
    expect(res).toEqual({
      slug: 'python-lab',
      inviteToken: 'secret123',
      viewToken: undefined,
    });
  });

  it('parses full production URL with view token', () => {
    const res = parseClassLinkOrCode('https://codetogether.dev/room/cpp-systems?view=viewxyz');
    expect(res).toEqual({
      slug: 'cpp-systems',
      inviteToken: undefined,
      viewToken: 'viewxyz',
    });
  });

  it('parses relative path with invite token', () => {
    const res = parseClassLinkOrCode('/room/demo-workspace?invite=tok789');
    expect(res).toEqual({
      slug: 'demo-workspace',
      inviteToken: 'tok789',
      viewToken: undefined,
    });
  });

  it('parses relative path without token', () => {
    const res = parseClassLinkOrCode('/room/demo-workspace');
    expect(res).toEqual({
      slug: 'demo-workspace',
    });
  });

  it('parses slug with query param directly', () => {
    const res = parseClassLinkOrCode('demo-workspace?invite=token999');
    expect(res).toEqual({
      slug: 'demo-workspace',
      inviteToken: 'token999',
      viewToken: undefined,
    });
  });

  it('parses plain slug or code', () => {
    const res = parseClassLinkOrCode('python-lab');
    expect(res).toEqual({
      slug: 'python-lab',
    });
  });

  it('handles surrounding whitespace and trailing slashes', () => {
    const res = parseClassLinkOrCode('   /room/algo-101/   ');
    expect(res).toEqual({
      slug: 'algo-101',
    });
  });

  it('returns null for empty or invalid input', () => {
    expect(parseClassLinkOrCode('')).toBeNull();
    expect(parseClassLinkOrCode('   ')).toBeNull();
    expect(parseClassLinkOrCode(null)).toBeNull();
    expect(parseClassLinkOrCode('http://invalid space url/')).toBeNull();
  });
});

