import { BooruSite } from '../BooruSite';
import { MoebooruPostsParser } from '../parser/MoebooruPostsParser';
import { PostsParser } from '../parser/PostsParser';
import { BooruAutoCompleteResult, BooruSort, BooruSortOrder } from '../types';

export class Konachan extends BooruSite {
    public getName(): string {
        return 'Konachan';
    }

    public getSlug(): string {
        return 'konachan';
    }

    public getWebsite(): string {
        return 'https://konachan.com';
    }

    public getFileHosts(): string[] {
        return ['konachan.com'];
    }

    protected getCredentials(): Record<string, string> | null {
        return null;
    }

    public canSortRandomly(): boolean {
        return true;
    }

    protected getPostsParser(): PostsParser {
        return new MoebooruPostsParser();
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
        const url = new URL('https://konachan.com/post.json');
        if (tags.length > 0) url.searchParams.set('tags', tags.join(' '));
        if (limit !== undefined) url.searchParams.set('limit', String(limit));
        if (page !== undefined) url.searchParams.set('page', String(page));
        return url;
    }

    public override async autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        return this.standardAutocomplete(
            query,
            'https://konachan.com/tag.json?order=count&limit=20',
            {
                queryParam: 'name',
                useCredentials: false,
                mapper: (data) =>
                    data.map((tag: any) => ({
                        label: `${tag.name} (${tag.count})`,
                        value: tag.name,
                    })),
            }
        );
    }
}
