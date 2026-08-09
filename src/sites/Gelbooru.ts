import { GelbooruDapiSite } from './GelbooruDapiSite';
import { BooruAutoCompleteResult } from '../types';

export interface GelbooruCredentials {
    apiKey: string;
    userId: string;
}

export class Gelbooru extends GelbooruDapiSite {
    private readonly credentials: GelbooruCredentials;

    /**
     * gelbooru.com requires an API key and user id for every API request.
     * Get them at https://gelbooru.com/index.php?page=account&s=options
     */
    public constructor(credentials: GelbooruCredentials) {
        super();
        if (!credentials?.apiKey || !credentials?.userId) {
            throw new Error(
                'Gelbooru requires an apiKey and userId. Get them at https://gelbooru.com/index.php?page=account&s=options'
            );
        }
        this.credentials = credentials;
    }

    public getName(): string {
        return 'Gelbooru';
    }

    public getSlug(): string {
        return 'gelbooru';
    }

    public getWebsite(): string {
        return 'https://gelbooru.com';
    }

    public getFileHosts(): string[] {
        return [
            'gelbooru.com',
            'img1.gelbooru.com',
            'img2.gelbooru.com',
            'img3.gelbooru.com',
        ];
    }

    protected getCredentials(): Record<string, string> | null {
        return {
            api_key: this.credentials.apiKey,
            user_id: this.credentials.userId,
        };
    }

    protected getBaseUrl(): string {
        return 'https://gelbooru.com/index.php';
    }

    // Gelbooru API wraps results as `{ "@attributes": {...}, "post": [...] }` instead of returning a bare array.
    protected override async responseToRawData(
        response: Response
    ): Promise<any> {
        const data = await response.json();
        const posts = data?.post;
        if (Array.isArray(posts)) return posts;
        if (posts && typeof posts === 'object') return [posts];
        return [];
    }

    public override async autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        return await this.standardAutocomplete(
            query,
            `https://gelbooru.com/index.php?page=autocomplete2`,
            {
                queryParam: 'term',
                useCredentials: false,
            }
        );
    }
}
