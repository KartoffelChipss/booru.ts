import { Paheal } from '../../src';
import { expectNonIncreasing, expectValidPost } from './helpers';

describe('Paheal (integration)', () => {
    const site = new Paheal();

    it('exposes site metadata', () => {
        expect(site.getName()).toBe('Paheal');
        expect(site.getSlug()).toBe('paheal');
        expect(site.getWebsite()).toBe('https://rule34.paheal.net');
        expect(site.canSortRandomly()).toBe(false);
    });

    it('searches posts and returns a valid shape', async () => {
        const posts = await site.search({ limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) expectValidPost(post);
    });

    it('filters by tag', async () => {
        const posts = await site.search({ tags: ['animated'], limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) {
            expect(post.tags.some((tag) => tag.name === 'animated')).toBe(true);
        }
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

    it('rejects random sorting, which this API does not support', async () => {
        await expect(site.search({ sort: 'random' })).rejects.toThrow(
            /does not support random sorting/
        );
    });

    it('autocompletes tags matching the query', async () => {
        const results = await site.autocomplete('blue');
        expect(results.length).toBeGreaterThan(0);
        for (const result of results) {
            expect(typeof result.label).toBe('string');
            expect(typeof result.value).toBe('string');
            expect(result.label).toContain(result.value);
            expect(result.value.toLowerCase()).toContain('blue');
        }
    });
});
