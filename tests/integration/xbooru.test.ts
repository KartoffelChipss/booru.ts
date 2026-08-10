import { XBooru } from '../../src';
import {
    expectNonDecreasing,
    expectNonIncreasing,
    expectValidPost,
} from './helpers';

describe('XBooru (integration)', () => {
    const site = new XBooru();

    it('exposes site metadata', () => {
        expect(site.getName()).toBe('XBooru');
        expect(site.getSlug()).toBe('xbooru');
        expect(site.getWebsite()).toBe('https://xbooru.com');
        expect(site.canSortRandomly()).toBe(true);
    });

    it('searches posts and returns a valid shape', async () => {
        const posts = await site.search({ limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) expectValidPost(post);
    });

    it('filters by tag', async () => {
        const posts = await site.search({ tags: ['1girl'], limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) {
            expect(post.tags.some((tag) => tag.name === '1girl')).toBe(true);
        }
    });

    it('populates tag type and count from tag_info', async () => {
        const posts = await site.search({ tags: ['1girl'], limit: 3 });
        const tag = posts[0].tags.find((t) => t.name === '1girl');
        expect(tag).toBeDefined();
        expect(typeof tag?.count).toBe('number');
        expect(tag!.count as number).toBeGreaterThan(0);
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
            page: 0,
        });
        const page2 = await site.search({
            sort: 'created',
            sortOrder: 'desc',
            limit: 3,
            page: 1,
        });
        expect(page1.map((p) => p.id)).not.toEqual(page2.map((p) => p.id));
    });

    it('returns an empty array for a search with no matches', async () => {
        // xbooru.com (like the rest of the Gelbooru DAPI family) returns a
        // zero-byte body rather than "[]" when nothing matches.
        const posts = await site.search({
            tags: ['asdkjfhaslkdjfhqwerty12345nonexistent'],
        });
        expect(posts).toEqual([]);
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
