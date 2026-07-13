import { BooruSite } from '../BooruSite';
import { DanbooruPostsParser } from '../parser/DanbooruPostsParser';
import { PostsParser } from '../parser/PostsParser';
import {
    BooruAutoCompleteResult,
    BooruSort,
    BooruSortOrder,
    MaxTags,
} from '../types';

export interface DanbooruCredentials {
    login: string;
    apiKey: string;
}

export class Danbooru extends BooruSite {
    private readonly credentials: DanbooruCredentials | null;

    public constructor(credentials?: DanbooruCredentials) {
        super();
        this.credentials = credentials ?? null;
    }

    public getName(): string {
        return 'Danbooru';
    }

    public getSlug(): string {
        return 'danbooru';
    }

    public getWebsite(): string {
        return 'https://danbooru.donmai.us';
    }

    public getFileHosts(): string[] {
        return ['cdn.donmai.us', 'danbooru.donmai.us'];
    }

    protected getCredentials(): Record<string, string> | null {
        if (!this.credentials) return null;
        return {
            login: this.credentials.login,
            api_key: this.credentials.apiKey,
        };
    }

    public getMaxTags(): MaxTags {
        // Anonymous/basic accounts get 2 tags; Gold and above get 6+.
        return { unauthenticated: 2, authenticated: 6 };
    }

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
        const url = new URL('https://danbooru.donmai.us/posts.json');
        if (tags.length > 0) url.searchParams.set('tags', tags.join(' '));
        if (limit !== undefined) url.searchParams.set('limit', String(limit));
        if (page !== undefined) url.searchParams.set('page', String(page));
        return url;
    }

    public override async autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        const url = new URL('https://danbooru.donmai.us/autocomplete.json');
        url.searchParams.append('search[query]', query);
        url.searchParams.append('search[type]', 'tag_query');
        url.searchParams.append('version', '3');
        url.searchParams.append('limit', '20');
        return this.fetchAutocomplete(url);
    }
}
