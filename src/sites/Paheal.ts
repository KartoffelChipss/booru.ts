import { BooruSite } from '../BooruSite';
import { PahealPostsParser, PahealRawPost } from '../parser/PahealPostsParser';
import { PostsParser } from '../parser/PostsParser';
import { BooruAutoCompleteResult, BooruSort, BooruSortOrder } from '../types';

export class Paheal extends BooruSite {
    private static readonly TAG_ELEMENT_REGEX = /<tag\s+([^>]*)>/g;
    private static readonly ATTRIBUTE_REGEX = /(\w+)=(['"])(.*?)\2/g;

    public getName(): string {
        return 'Paheal';
    }

    public getSlug(): string {
        return 'paheal';
    }

    public getWebsite(): string {
        return 'https://rule34.paheal.net';
    }

    public getFileHosts(): string[] {
        return ['rule34.paheal.net', 'r34i.paheal-cdn.net', 'r34t.paheal.net'];
    }

    protected getCredentials(): Record<string, string> | null {
        return null;
    }

    public canSortRandomly(): boolean {
        return false;
    }

    protected getPostsParser(): PostsParser {
        return new PahealPostsParser();
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
                throw new Error('Paheal does not support random sorting.');
            default:
                throw new Error(`Unsupported sort type: ${sort}`);
        }
    }

    protected getPostsUrl(tags: string[], limit?: number, page?: number): URL {
        const url = new URL(
            'https://rule34.paheal.net/api/danbooru/find_posts'
        );
        if (tags.length > 0) url.searchParams.set('tags', tags.join(' '));
        if (limit !== undefined) url.searchParams.set('limit', String(limit));
        if (page !== undefined) url.searchParams.set('page', String(page));
        return url;
    }

    // Paheal's Danbooru-compatible API only returns XML, so this overrides
    // the JSON default and hand-parses the flat `<tag attr='...' .../>` posts
    // (no XML parser dependency is otherwise needed by this library).
    protected async responseToRawData(
        response: Response
    ): Promise<PahealRawPost[]> {
        const xml = await response.text();
        const posts: PahealRawPost[] = [];

        for (const tagMatch of xml.matchAll(Paheal.TAG_ELEMENT_REGEX)) {
            const attributes: PahealRawPost = {};
            for (const attrMatch of tagMatch[1].matchAll(
                Paheal.ATTRIBUTE_REGEX
            )) {
                attributes[attrMatch[1]] = this.unescapeXml(attrMatch[3]);
            }
            posts.push(attributes);
        }

        return posts;
    }

    public override autocomplete(
        query: string
    ): Promise<BooruAutoCompleteResult[]> {
        return this.standardAutocomplete(
            query,
            `https://rule34.paheal.net/api/internal/autocomplete`,
            {
                queryParam: 's',
                mapper: (data) =>
                    Object.entries(data).map(([key, value]) => ({
                        label: `${key} (${(value as any).count})`,
                        value: key,
                    })),
            }
        );
    }

    private unescapeXml(value: string): string {
        return value
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
            .replace(/&amp;/g, '&');
    }
}
