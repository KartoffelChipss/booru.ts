import { GelbooruDapiSite } from './GelbooruDapiSite';

export interface Rule34Credentials {
    apiKey: string;
    userId: string;
}

export class Rule34 extends GelbooruDapiSite {
    private readonly credentials: Rule34Credentials;

    /**
     * Since 2025-08-19, rule34.xxx requires an API key and user id for every
     * API request. Get them at https://rule34.xxx/index.php?page=account&s=options
     */
    public constructor(credentials: Rule34Credentials) {
        super();
        if (!credentials?.apiKey || !credentials?.userId) {
            throw new Error(
                'Rule34 requires an apiKey and userId. Get them at https://rule34.xxx/index.php?page=account&s=options'
            );
        }
        this.credentials = credentials;
    }

    public getName(): string {
        return 'Rule34';
    }

    public getSlug(): string {
        return 'rule34';
    }

    public getWebsite(): string {
        return 'https://rule34.xxx';
    }

    public getFileHosts(): string[] {
        return ['rule34.xxx', 'wimg.rule34.xxx', 'api-cdn.rule34.xxx'];
    }

    protected getCredentials(): Record<string, string> | null {
        return {
            api_key: this.credentials.apiKey,
            user_id: this.credentials.userId,
        };
    }

    protected getBaseUrl(): string {
        return 'https://api.rule34.xxx/index.php';
    }
}
