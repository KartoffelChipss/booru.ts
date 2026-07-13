import { GelbooruDapiSite } from './GelbooruDapiSite';

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
}
