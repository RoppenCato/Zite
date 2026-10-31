import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The rules are a pure function: no screen, no socket, no clock, no Math.random, no packages.
// This test reads the source and refuses the things that would break that. Cheap, and it catches a slip early.
const SRC = join(import.meta.dirname, '..', 'src');

const FORBIDDEN = [
  /Math\.random/,
  /Date\.now/,
  /new Date\b/,
  /performance\.now/,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\brequestAnimationFrame\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\bnavigator\b/,
  /\blocalStorage\b/,
  /\bfetch\(/,
  /\bWebSocket\b/,
  /\bconsole\./,
  /\bprocess\./,
  /\brequire\(/,
];

function sources(): string[] {
  return readdirSync(SRC)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join(SRC, f));
}

describe('the rules stay pure', () => {
  it('has source files to check', () => {
    expect(sources().length).toBeGreaterThan(0);
  });

  for (const file of sources()) {
    const text = readFileSync(file, 'utf8');
    const name = file.slice(SRC.length + 1);

    it(`${name} touches no screen, socket, clock or Math.random`, () => {
      for (const pattern of FORBIDDEN) {
        expect(text, `${name} matches ${pattern}`).not.toMatch(pattern);
      }
    });

    it(`${name} imports only its own files and its data`, () => {
      const imports = [...text.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!);
      for (const spec of imports) {
        expect(spec.startsWith('./') || spec.startsWith('../data/'), `${name} imports ${spec}`).toBe(true);
      }
    });
  }
});
