import { describe, expect, it } from 'vitest';

describe('demo catalog safety', () => {
  it('does not enable demo catalog unless explicitly opted in', () => {
    expect(process.env.VITE_ENABLE_DEMO_CATALOG).not.toBe('true');
  });
});
