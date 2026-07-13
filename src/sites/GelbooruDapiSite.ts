import { BooruSite } from '../BooruSite';
import { BasePostsParser } from '../parser/BasePostsParser';
import { PostsParser } from '../parser/PostsParser';
import { BooruSort, BooruSortOrder } from '../types';

/**
 * Shared implementation for sites running the Gelbooru-derived DAPI
 * (`index.php?page=dapi&s=post&q=index`), e.g. rule34.xxx and safebooru.org.
 */
export abstract class GelbooruDapiSite extends BooruSite {
    protected abstract getBaseUrl(): string;

    public canSortRandomly(): boolean {
        return true;
    }

    protected getPostsParser(): PostsParser {
        return new BasePostsParser();
    }

    protected getSortTag(
        sort: BooruSort,
        order: BooruSortOrder | undefined | null,
        otherTags: string[]
    ): string | null {
        // This DAPI orders posts by id rather than a dedicated "created" tag.
        if (sort === 'created') {
            const orderString = order ? `:${order}` : '';
            return `sort:id${orderString}`;
        }
        return super.getSortTag(sort, order, otherTags);
    }

    protected getPostsUrl(tags: string[], limit?: number, page?: number): URL {
        const url = new URL(this.getBaseUrl());
        url.searchParams.set('page', 'dapi');
        url.searchParams.set('s', 'post');
        url.searchParams.set('q', 'index');
        url.searchParams.set('json', '1');
        // Requests per-tag type/count info so BasePostsParser can populate BooruTag fully.
        url.searchParams.set('fields', 'tag_info');
        if (tags.length > 0) url.searchParams.set('tags', tags.join(' '));
        if (limit !== undefined) url.searchParams.set('limit', String(limit));
        if (page !== undefined) url.searchParams.set('pid', String(page));
        return url;
    }
}
