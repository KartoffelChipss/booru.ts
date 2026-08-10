import { GelbooruDapiSite } from './GelbooruDapiSite';
import { BooruAutoCompleteResult } from '../types';

export class HypnoHub extends GelbooruDapiSite {
    public getName(): string {
        return 'HypnoHub';
    }

    public getSlug(): string {
        return 'hypnohub';
    }

    public getWebsite(): string {
        return 'https://hypnohub.net';
    }

    public getFileHosts(): string[] {
        return ['hypnohub.net'];
    }

    protected getCredentials(): Record<string, string> | null {
        return null;
    }

    protected getBaseUrl(): string {
        return 'https://hypnohub.net/index.php';
    }

    public override async autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        return await this.standardAutocomplete(
            query,
            `https://hypnohub.net/autocomplete.php`
        );
    }
}
