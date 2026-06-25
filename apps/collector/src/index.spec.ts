import { walkJsonl } from './index';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('walkJsonl resilience', () => {
  it('returns [] for a non-existent directory and does not throw', () => {
    const result = walkJsonl('/tmp/__does_not_exist_ai_report_test__/nonexistent');
    expect(result).toEqual([]);
  });

  it('skips a nested non-existent subdirectory and still collects other files', () => {
    const base = mkdtempSync(join(tmpdir(), 'walktest-'));
    // Create a valid .jsonl file at root level
    writeFileSync(join(base, 'valid.jsonl'), '{"uuid":"x"}\n');
    // Create a real subdirectory with a jsonl file
    const sub = join(base, 'sub');
    mkdirSync(sub);
    writeFileSync(join(sub, 'nested.jsonl'), '{"uuid":"y"}\n');

    const files = walkJsonl(base);
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.endsWith('valid.jsonl'))).toBe(true);
    expect(files.some((f) => f.endsWith('nested.jsonl'))).toBe(true);
  });

  it('does not throw when called on a path that is a file instead of a dir', () => {
    const base = mkdtempSync(join(tmpdir(), 'walktest2-'));
    const filePath = join(base, 'notadir.txt');
    writeFileSync(filePath, 'hello');
    // walkJsonl on a file path — readdirSync will throw ENOTDIR, should return []
    expect(() => walkJsonl(filePath)).not.toThrow();
    expect(walkJsonl(filePath)).toEqual([]);
  });
});
