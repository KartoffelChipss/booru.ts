import { Rule34 } from '../../src';
import {
    expectNonDecreasing,
    expectNonIncreasing,
    expectValidPost,
} from './helpers';

describe('Rule34 (integration)', () => {
    it('requires credentials', () => {
        expect(() => new Rule34({ apiKey: '', userId: '' })).toThrow(
            /requires an apiKey and userId/
        );
    });

    it('exposes site metadata', () => {
        const site = new Rule34({ apiKey: 'key', userId: '1' });
        expect(site.getName()).toBe('Rule34');
        expect(site.getSlug()).toBe('rule34');
        expect(site.getWebsite()).toBe('https://rule34.xxx');
        expect(site.canSortRandomly()).toBe(true);
    });

    // The autocomplete endpoint doesn't require the api_key/user_id that
    // posts search needs, so this runs unconditionally with dummy
    // construction credentials.
    it('autocompletes tags matching the query', async () => {
        const site = new Rule34({ apiKey: 'dummy', userId: '1' });
        const results = await site.autocomplete('blue');
        expect(results.length).toBeGreaterThan(0);
        for (const result of results) {
            expect(typeof result.label).toBe('string');
            expect(typeof result.value).toBe('string');
            expect(result.value.toLowerCase()).toContain('blue');
        }
    });

    // rule34.xxx has required a real account's api_key + user_id for every
    // API request since 2025-08-19, so the tests below only run when
    // RULE34_API_KEY and RULE34_USER_ID are set in the environment.
    const apiKey = process.env.RULE34_API_KEY;
    const userId = process.env.RULE34_USER_ID;
    const describeWithCredentials = apiKey && userId ? describe : describe.skip;

    describeWithCredentials('with valid credentials', () => {
        // Constructed lazily inside each test so that describe.skip (which
        // still executes this block's body during collection) never runs
        // the Rule34 constructor with missing credentials.
        const getSite = () =>
            new Rule34({ apiKey: apiKey as string, userId: userId as string });

        it('searches posts and returns a valid shape', async () => {
            const posts = await getSite().search({ limit: 5 });
            expect(posts.length).toBeGreaterThan(0);
            for (const post of posts) expectValidPost(post);
        });

        it('filters by tag', async () => {
            const posts = await getSite().search({
                tags: ['1girl'],
                limit: 5,
            });
            expect(posts.length).toBeGreaterThan(0);
            for (const post of posts) {
                expect(post.tags.some((tag) => tag.name === '1girl')).toBe(
                    true
                );
            }
        });

        it('sorts by score', async () => {
            const desc = await getSite().search({
                sort: 'score',
                sortOrder: 'desc',
                limit: 5,
            });
            expectNonIncreasing(desc.map((p) => p.score));

            const asc = await getSite().search({
                sort: 'score',
                sortOrder: 'asc',
                limit: 5,
            });
            expectNonDecreasing(asc.map((p) => p.score));
        });

        it('sorts by creation order', async () => {
            const posts = await getSite().search({
                sort: 'created',
                sortOrder: 'desc',
                limit: 5,
            });
            expectNonIncreasing(posts.map((p) => Number(p.id)));
        });
    });
});
