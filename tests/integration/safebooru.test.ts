import { Safebooru } from '../../src';
import {
    expectNonDecreasing,
    expectNonIncreasing,
    expectValidPost,
} from './helpers';

describe('Safebooru (integration)', () => {
    const site = new Safebooru();

    it('exposes site metadata', () => {
        expect(site.getName()).toBe('Safebooru');
        expect(site.getSlug()).toBe('safebooru');
        expect(site.getWebsite()).toBe('https://safebooru.org');
        expect(site.canSortRandomly()).toBe(true);
    });

    it('searches posts and returns a valid shape', async () => {
        const posts = await site.search({ limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) expectValidPost(post);
    });

    it('maps the rating:general filter to a safe rating', async () => {
        const posts = await site.search({ tags: ['rating:general'], limit: 5 });
        expect(posts.length).toBeGreaterThan(0);
        for (const post of posts) expect(post.rating).toBe('safe');
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
        expect(tag?.type).toBe('general');
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
});
