import { PostsParser } from './parser/PostsParser';
import {
    BooruImage,
    BooruMediaType,
    BooruPost,
    BooruRating,
    BooruSearchOptions,
    BooruSort,
    BooruSortOrder,
    BooruTagType,
    isBooruRating,
    MaxTags,
} from './types';

export abstract class BooruSite {
    /**
     * Get the name of the Booru site.
     * @returns The name of the Booru site.
     */
    public abstract getName(): string;
    /**
     * Get the slug of the Booru site.
     * @returns The unique slug of the Booru site.
     */
    public abstract getSlug(): string;
    /**
     * Get the website URL of the Booru site.
     * @returns The website URL of the Booru site.
     */
    public abstract getWebsite(): string;
    /**
     * Get a list of file hosts used by the Booru site.
     * @returns An array of file host URLs.
     */
    public abstract getFileHosts(): string[];

    /**
     * Get the credentials required for accessing the Booru site, if any. The keys of the returned object should be the names of the credentials, and the values should be the corresponding credential values.
     * @returns An object containing the credentials, or null if no credentials are required.
     */
    protected abstract getCredentials(): Record<string, string> | null;

    /**
     * Get the maximum number of tags that can be used in a search query for unauthenticated and authenticated users.
     * @returns An object containing the maximum number of tags for unauthenticated and authenticated users, or null if there is no limit.
     */
    public getMaxTags(): MaxTags | null {
        return null;
    }

    /**
     * Check if the Booru site supports random sorting of posts.
     * @returns True if the Booru site supports random sorting, false otherwise.
     */
    public abstract canSortRandomly(): boolean;

    protected abstract getPostsParser(): PostsParser;

    protected getSortTag(
        sort: BooruSort,
        order: BooruSortOrder | undefined | null,
        otherTags: string[]
    ): string | null {
        const orderString = order ? `:${order}` : '';
        switch (sort) {
            case 'score':
                return `sort:score${orderString}`;
            case 'created':
                return `sort:created${orderString}`;
            case 'random':
                return 'sort:random';
            default:
                throw new Error(`Unsupported sort type: ${sort}`);
        }
    }

    protected abstract getPostsUrl(
        tags: string[],
        limit?: number,
        page?: number
    ): URL;

    private addCredentialsToUrl(url: URL): URL {
        const credentials = this.getCredentials();
        if (!credentials) return url;
        const urlWithCredentials = new URL(url.toString());
        for (const [key, value] of Object.entries(credentials)) {
            urlWithCredentials.searchParams.append(key, value);
        }
        return urlWithCredentials;
    }

    private async fetch(url: URL): Promise<Response> {
        const finalUrl = this.addCredentialsToUrl(url);
        return fetch(finalUrl, {
            method: 'GET',
        }).then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch data from ${url}: ${response.status} ${response.statusText}`
                );
            }
            return response;
        });
    }

    protected responseToRawData(response: Response): Promise<any> {
        return response.json();
    }

    public async search(options: BooruSearchOptions): Promise<BooruPost[]> {
        const { tags = [], sort, sortOrder, limit, page } = options;
        const allTags = tags;
        const sortTag = sort ? this.getSortTag(sort, sortOrder, tags) : null;
        if (sortTag) allTags.push(sortTag);
        if (this.getMaxTags()) {
            const maxTags = this.getMaxTags()!;
            const maxAllowedTags = limit
                ? maxTags.authenticated
                : maxTags.unauthenticated;
            if (allTags.length > maxAllowedTags) {
                throw new Error(
                    `Too many tags provided. Maximum allowed tags: ${maxAllowedTags}`
                );
            }
        }
        const url = this.getPostsUrl(allTags, limit, page);
        const response = await this.fetch(url);
        const rawData = await this.responseToRawData(response);
        const parser = this.getPostsParser();
        return parser.parse(rawData);
    }
}
