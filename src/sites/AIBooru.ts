import { DanbooruDapiSite } from './DanbooruDapiSite';
import { BooruAutoCompleteResult, MaxTags } from '../types';

export interface AIBooruCredentials {
    login: string;
    apiKey: string;
}

export class AIBooru extends DanbooruDapiSite {
    private readonly credentials: AIBooruCredentials | null;

    public constructor(credentials?: AIBooruCredentials) {
        super();
        this.credentials = credentials ?? null;
    }

    public getName(): string {
        return 'AIBooru';
    }

    public getSlug(): string {
        return 'aibooru';
    }

    public getWebsite(): string {
        return 'https://aibooru.online';
    }

    public getFileHosts(): string[] {
        return ['cdn.aibooru.download', 'aibooru.online'];
    }

    protected getCredentials(): Record<string, string> | null {
        if (!this.credentials) return null;
        return {
            login: this.credentials.login,
            api_key: this.credentials.apiKey,
        };
    }

    public getMaxTags(): MaxTags {
        return { unauthenticated: 4, authenticated: 6 };
    }

    protected getBaseUrl(): string {
        return 'https://aibooru.online';
    }

    public override async autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        return this.danbooruAutocomplete(query);
    }
}
