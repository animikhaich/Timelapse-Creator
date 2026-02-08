import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
  });

  it('handles objects', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
  });

  it('merges tailwind classes correctly', () => {
    // p-4 should overwrite p-2
    expect(cn('p-2', 'p-4')).toBe('p-4');
    // text-red-500 should overwrite text-blue-500
    expect(cn('text-blue-500', 'text-red-500')).toBe('text-red-500');
  });

  it('handles arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('handles nested arrays', () => {
    expect(cn(['class1', ['class2', 'class3']])).toBe('class1 class2 class3');
  });

  it('handles undefined and null', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });
});
