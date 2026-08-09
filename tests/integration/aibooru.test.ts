import { AIBooru } from '../../src';
import {
    expectNonDecreasing,
    expectNonIncreasing,
    expectValidPost,
} from './helpers';

describe('AIBooru (integration)', () => {
    const site = new AIBooru();

    it('exposes site metadata', () => {
        expect(site.getName()).toBe('AIBooru');
        expect(site.getSlug()).toBe('aibooru');
        expect(site.getWebsite()).toBe('https://aibooru.online');
        expect(site.canSortRandomly()).toBe(true);
        expect(site.getMaxTags()).toEqual({
            unauthenticated: 4,
            authenticated: 6,
        });
    });

    it('searches posts and returns a valid shape', async () => {
        const posts = await site.search({ tags: ['rating:general'], limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) {
            expectValidPost(post);
            expect(post.rating).toBe('safe');
        }
    });

    it('filters by tag and splits tag types', async () => {
        const posts = await site.search({ tags: ['solo'], limit: 3 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) {
            expect(post.tags.some((tag) => tag.name === 'solo')).toBe(true);
            for (const tag of post.tags) {
                expect([
                    'general',
                    'artist',
                    'copyright',
                    'character',
                    'metadata',
                ]).toContain(tag.type);
            }
        }
    });

    it('sorts by score', async () => {
        const desc = await site.search({
            tags: ['rating:general'],
            sort: 'score',
            sortOrder: 'desc',
            limit: 5,
        });
        expectNonIncreasing(desc.map((p) => p.score));

        const asc = await site.search({
            tags: ['rating:general'],
            sort: 'score',
            sortOrder: 'asc',
            limit: 5,
        });
        expectNonDecreasing(asc.map((p) => p.score));
    });

    it('sorts by creation order', async () => {
        const posts = await site.search({
            tags: ['rating:general'],
            sort: 'created',
            sortOrder: 'desc',
            limit: 5,
        });
        expectNonIncreasing(posts.map((p) => Number(p.id)));
    });

    it('paginates results', async () => {
        const page1 = await site.search({
            tags: ['rating:general'],
            sort: 'created',
            sortOrder: 'desc',
            limit: 3,
            page: 1,
        });
        const page2 = await site.search({
            tags: ['rating:general'],
            sort: 'created',
            sortOrder: 'desc',
            limit: 3,
            page: 2,
        });
        expect(page1.map((p) => p.id)).not.toEqual(page2.map((p) => p.id));
    });

    it('rejects too many tags for an unauthenticated search', async () => {
        await expect(
            site.search({ tags: ['a', 'b', 'c', 'd', 'e'] })
        ).rejects.toThrow(/Too many tags/);
    });

    it('autocompletes tags matching the query', async () => {
        const results = await site.autocomplete('blue');
        expect(results.length).toBeGreaterThan(0);
        for (const result of results) {
            expect(typeof result.label).toBe('string');
            expect(typeof result.value).toBe('string');
            const antecedent = (result as { antecedent?: string }).antecedent;
            const matchesQuery =
                result.value.toLowerCase().includes('blue') ||
                result.label.toLowerCase().includes('blue') ||
                (antecedent?.toLowerCase().includes('blue') ?? false);
            expect(matchesQuery).toBe(true);
        }
    });
});
