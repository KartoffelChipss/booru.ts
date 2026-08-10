import { GelbooruDapiSite } from './GelbooruDapiSite';
import { BooruAutoCompleteResult } from '../types';

export class XBooru extends GelbooruDapiSite {
    public getName(): string {
        return 'XBooru';
    }

    public getSlug(): string {
        return 'xbooru';
    }

    public getWebsite(): string {
        return 'https://xbooru.com';
    }

    public getFileHosts(): string[] {
        return ['xbooru.com', 'img.xbooru.com'];
    }

    protected getCredentials(): Record<string, string> | null {
        return null;
    }

    protected getBaseUrl(): string {
        return 'https://xbooru.com/index.php';
    }

    public override async autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        return await this.standardAutocomplete(
            query,
            `https://xbooru.com/autocomplete.php`
        );
    }
}
