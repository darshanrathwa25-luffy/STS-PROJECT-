import { describe, it, expect } from 'vitest';
import { CHAPTERS, STEPS, stepToHash, hashToStep, currentStepIndex, pagesOf } from '../chapters';
import { questionById } from '../questions';

describe('Book structure', () => {
  it('every page has a unique address that leads back to it', () => {
    const hashes = STEPS.map(stepToHash);
    expect(new Set(hashes).size).toBe(STEPS.length);
    STEPS.forEach((s) => expect(hashToStep(stepToHash(s))).toBe(s));
  });

  it('handles the cover, bare chapters and unknown addresses', () => {
    expect(hashToStep('')).toBeNull();
    expect(hashToStep('#/')).toBeNull();
    expect(hashToStep('#/parallels')).toBe(pagesOf(2)[0]);
    expect(hashToStep('#/nowhere')).toBeUndefined();
    expect(hashToStep('#/triangles/moon')).toBeUndefined();
    // moved in a later version of the book
    expect(hashToStep('#/disk/circles')).toBe(pagesOf(3)[2]);
  });

  it('each view on screen belongs to exactly one page', () => {
    STEPS.forEach((s, i) => {
      expect(currentStepIndex(s.lab, s.world ?? 'flat', s.exploration ?? 'walk')).toBe(i);
    });
  });

  it('chapters are in order and every page question exists', () => {
    expect(CHAPTERS.map((c) => c.number)).toEqual([1, 2, 3, 4, 5]);
    for (let i = 1; i < STEPS.length; i++) expect(STEPS[i].chapter).toBeGreaterThanOrEqual(STEPS[i - 1].chapter);
    STEPS.filter((s) => s.questionId).forEach((s) => expect(questionById(s.questionId!)).toBeDefined());
  });
});
