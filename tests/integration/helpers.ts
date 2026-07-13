import { BooruPost, isBooruRating } from '../../src';

export function expectValidPost(post: BooruPost): void {
    expect(post.id).toBeTruthy();
    expect(typeof post.id).toBe('string');
    expect(post.originalFile.url).toMatch(/^https?:\/\//);
    expect(isBooruRating(post.rating)).toBe(true);
    expect(['image', 'video', 'animated']).toContain(post.mediaType);
    expect(typeof post.score).toBe('number');
    expect(Number.isNaN(post.score)).toBe(false);
    expect(Array.isArray(post.tags)).toBe(true);
    for (const tag of post.tags) {
        expect(typeof tag.name).toBe('string');
        expect(tag.name.length).toBeGreaterThan(0);
    }
}

export function expectNonIncreasing(values: number[]): void {
    for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
}

export function expectNonDecreasing(values: number[]): void {
    for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
}
