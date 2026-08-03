import { Yandere } from '../../src';
import {
    expectNonDecreasing,
    expectNonIncreasing,
    expectValidPost,
} from './helpers';

describe('Yandere (integration)', () => {
    const site = new Yandere();

    it('exposes site metadata', () => {
        expect(site.getName()).toBe('Yande.re');
        expect(site.getSlug()).toBe('yandere');
        expect(site.getWebsite()).toBe('https://yande.re');
        expect(site.canSortRandomly()).toBe(true);
        expect(site.getMaxTags()).toEqual({
            unauthenticated: 2,
            authenticated: 6,
        });
    });

    it('searches posts and returns a valid shape', async () => {
        const posts = await site.search({ tags: ['rating:safe'], limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) {
            expectValidPost(post);
            expect(post.rating).toBe('safe');
        }
    });

    it('filters by tag', async () => {
        const posts = await site.search({ tags: ['touhou'], limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) {
            expect(post.tags.some((tag) => tag.name === 'touhou')).toBe(true);
        }
    });

    it('sorts by score', async () => {
        const desc = await site.search({
            sort: 'score',
            sortOrder: 'desc',
            limit: 5,
        });
        expectNonIncreasing(desc.map((p) => p.score));

        const asc = await site.search({
            sort: 'score',
            sortOrder: 'asc',
            limit: 5,
        });
        expectNonDecreasing(asc.map((p) => p.score));
    });

    it('sorts by creation order', async () => {
        const posts = await site.search({
            sort: 'created',
            sortOrder: 'desc',
            limit: 5,
        });
        expectNonIncreasing(posts.map((p) => Number(p.id)));
    });

    it('paginates results', async () => {
        const page1 = await site.search({
            sort: 'created',
            sortOrder: 'desc',
            limit: 3,
            page: 1,
        });
        const page2 = await site.search({
            sort: 'created',
            sortOrder: 'desc',
            limit: 3,
            page: 2,
        });
        expect(page1.map((p) => p.id)).not.toEqual(page2.map((p) => p.id));
    });

    it('autocompletes tags matching the query', async () => {
        const results = await site.autocomplete('blue');
        expect(results.length).toBeGreaterThan(0);
        for (const result of results) {
            expect(typeof result.label).toBe('string');
            expect(typeof result.value).toBe('string');
            expect(result.value.toLowerCase()).toContain('blue');
        }
    });
});
