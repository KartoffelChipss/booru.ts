import { BooruSite } from '../BooruSite';
import { DanbooruPostsParser } from '../parser/DanbooruPostsParser';
import { PostsParser } from '../parser/PostsParser';
import { BooruAutoCompleteResult, BooruSort, BooruSortOrder } from '../types';

/**
 * Shared implementation for sites running the Danbooru software
 * (`/posts.json`, `/autocomplete.json`), e.g. danbooru.donmai.us and aibooru.online.
 */
export abstract class DanbooruDapiSite extends BooruSite {
    protected abstract getBaseUrl(): string;

    public canSortRandomly(): boolean {
        return true;
    }

    protected getPostsParser(): PostsParser {
        return new DanbooruPostsParser();
    }

    protected getSortTag(
        sort: BooruSort,
        order: BooruSortOrder | undefined | null,
        otherTags: string[]
    ): string | null {
        switch (sort) {
            case 'score':
                return order === 'asc' ? 'order:score_asc' : 'order:score';
            case 'created':
                return order === 'asc' ? 'order:id' : 'order:id_desc';
            case 'random':
                return 'order:random';
            default:
                throw new Error(`Unsupported sort type: ${sort}`);
        }
    }

    protected getPostsUrl(tags: string[], limit?: number, page?: number): URL {
        const url = new URL(`${this.getBaseUrl()}/posts.json`);
        if (tags.length > 0) url.searchParams.set('tags', tags.join(' '));
        if (limit !== undefined) url.searchParams.set('limit', String(limit));
        if (page !== undefined) url.searchParams.set('page', String(page));
        return url;
    }

    protected async danbooruAutocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        const url = new URL(`${this.getBaseUrl()}/autocomplete.json`);
        url.searchParams.append('search[query]', query);
        url.searchParams.append('search[type]', 'tag_query');
        url.searchParams.append('version', '3');
        url.searchParams.append('limit', '20');
        return this.fetchAutocomplete(url);
    }
}
