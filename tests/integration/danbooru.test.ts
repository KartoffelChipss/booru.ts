import { Danbooru } from '../../src';
import {
    expectNonDecreasing,
    expectNonIncreasing,
    expectValidPost,
} from './helpers';

describe('Danbooru (integration)', () => {
    const site = new Danbooru();

    it('exposes site metadata', () => {
        expect(site.getName()).toBe('Danbooru');
        expect(site.getSlug()).toBe('danbooru');
        expect(site.getWebsite()).toBe('https://danbooru.donmai.us');
        expect(site.canSortRandomly()).toBe(true);
        expect(site.getMaxTags()).toEqual({
            unauthenticated: 2,
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
        // Unbounded order:score queries reliably time out on Danbooru's end;
        // an id lower-bound keeps the sorted set small enough to respond.
        const scopedTags = ['rating:general', 'id:>11780000'];

        const desc = await site.search({
            tags: [...scopedTags],
            sort: 'score',
            sortOrder: 'desc',
            limit: 5,
        });
        expectNonIncreasing(desc.map((p) => p.score));

        const asc = await site.search({
            tags: [...scopedTags],
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
        await expect(site.search({ tags: ['a', 'b', 'c'] })).rejects.toThrow(
            /Too many tags/
        );
    });
});
