import NodeCache from 'node-cache';
import { BooruSite } from './BooruSite';
import { PostsParser } from './parser/PostsParser';
import {
    BooruAutoCompleteResult,
    BooruPost,
    BooruSearchOptions,
    MaxTags,
} from './types';

export interface CachedBooruSiteOptions {
    /**
     * An existing NodeCache instance to use instead of creating a new one,
     * e.g. to share one cache across multiple wrapped sites.
     */
    cache?: NodeCache;
    /**
     * Time to live for cached `search` results, in seconds. Defaults to 300.
     */
    searchTtl?: number;
    /**
     * Time to live for cached `autocomplete` results, in seconds. Defaults to 300.
     */
    autocompleteTtl?: number;
}

/**
 * A proxy that wraps a BooruSite and transparently caches `search` and
 * `autocomplete` results with node-cache, so repeated identical requests are
 * served from memory instead of hitting the real site again.
 */
export class CachedBooruSite extends BooruSite {
    private readonly cache: NodeCache;
    private readonly searchTtl: number;
    private readonly autocompleteTtl: number;

    public constructor(
        private readonly site: BooruSite,
        options: CachedBooruSiteOptions = {}
    ) {
        super();
        this.cache = options.cache ?? new NodeCache();
        this.searchTtl = options.searchTtl ?? 300;
        this.autocompleteTtl = options.autocompleteTtl ?? 300;
    }

    public getName(): string {
        return this.site.getName();
    }

    public getSlug(): string {
        return this.site.getSlug();
    }

    public getWebsite(): string {
        return this.site.getWebsite();
    }

    public getFileHosts(): string[] {
        return this.site.getFileHosts();
    }

    public getMaxTags(): MaxTags | null {
        return this.site.getMaxTags();
    }

    public canSortRandomly(): boolean {
        return this.site.canSortRandomly();
    }

    protected getCredentials(): Record<string, string> | null {
        return null;
    }

    protected getPostsParser(): PostsParser {
        throw new Error(
            'getPostsParser() is unused: CachedBooruSite.search() delegates to the wrapped site.'
        );
    }

    protected getPostsUrl(): URL {
        throw new Error(
            'getPostsUrl() is unused: CachedBooruSite.search() delegates to the wrapped site.'
        );
    }

    private searchCacheKey(options: BooruSearchOptions): string {
        const { tags = [], sort, sortOrder, limit, page } = options;
        return `search:${this.site.getSlug()}:${JSON.stringify({
            tags,
            sort: sort ?? null,
            sortOrder: sortOrder ?? null,
            limit: limit ?? null,
            page: page ?? null,
        })}`;
    }

    private autocompleteCacheKey(query: string): string {
        return `autocomplete:${this.site.getSlug()}:${query}`;
    }

    public override async search(
        options: BooruSearchOptions
    ): Promise<BooruPost[]> {
        const key = this.searchCacheKey(options);
        const cached = this.cache.get<BooruPost[]>(key);
        if (cached) return cached;

        const posts = await this.site.search(options);
        this.cache.set(key, posts, this.searchTtl);
        return posts;
    }

    public override async autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        const key = this.autocompleteCacheKey(query);
        const cached = this.cache.get<BooruAutoCompleteResult[]>(key);
        if (cached) return cached;

        const results = await this.site.autocomplete(query);
        this.cache.set(key, results, this.autocompleteTtl);
        return results;
    }

    /**
     * Clear this site's cached results. If a shared cache was passed in via
     * options.cache, only keys belonging to this site are removed.
     */
    public clearCache(): void {
        const prefix = `:${this.site.getSlug()}:`;
        const keys = this.cache
            .keys()
            .filter(
                (key) =>
                    key.startsWith('search' + prefix) ||
                    key.startsWith('autocomplete' + prefix)
            );
        this.cache.del(keys);
    }
}
