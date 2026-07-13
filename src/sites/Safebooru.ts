import { GelbooruDapiSite } from './GelbooruDapiSite';
import { BooruAutoCompleteResult } from '../types';

export class Safebooru extends GelbooruDapiSite {
    public getName(): string {
        return 'Safebooru';
    }

    public getSlug(): string {
        return 'safebooru';
    }

    public getWebsite(): string {
        return 'https://safebooru.org';
    }

    public getFileHosts(): string[] {
        return ['safebooru.org'];
    }

    protected getCredentials(): Record<string, string> | null {
        return null;
    }

    protected getBaseUrl(): string {
        return 'https://safebooru.org/index.php';
    }

    public override async autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        return await this.standardAutocomplete(
            query,
            `https://safebooru.org/autocomplete.php`
        );
    }
}
