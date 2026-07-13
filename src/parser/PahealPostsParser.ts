import {
    BooruImage,
    BooruMediaType,
    BooruPost,
    BooruRating,
    BooruTag,
} from '../types';
import { PostsParser } from './PostsParser';

/** A single `<tag ...>` element's attributes, as extracted from Paheal's XML API. */
export type PahealRawPost = Record<string, string>;

export class PahealPostsParser implements PostsParser {
    private static readonly VIDEO_EXTENSIONS = new Set([
        'mp4',
        'webm',
        'mov',
        'm4v',
    ]);
    private static readonly ANIMATED_EXTENSIONS = new Set(['gif', 'apng']);

    private inferMediaType(fileName: string | undefined): BooruMediaType {
        const ext = fileName?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
        if (ext && PahealPostsParser.VIDEO_EXTENSIONS.has(ext)) return 'video';
        if (ext && PahealPostsParser.ANIMATED_EXTENSIONS.has(ext))
            return 'animated';
        return 'image';
    }

    private parseRating(rating: string | undefined): BooruRating {
        switch (rating) {
            case 's':
                return 'safe';
            case 'q':
                return 'questionable';
            case 'e':
                return 'explicit';
            default:
                // Paheal reports '?' for the vast majority of (unrated) posts.
                return 'unrated';
        }
    }

    private toNumber(value: string | undefined): number | null {
        if (value === undefined) return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }

    private parseSingle(rawPost: PahealRawPost): BooruPost {
        if (!rawPost || typeof rawPost !== 'object') {
            throw new Error('Invalid raw post data');
        }
        if (!rawPost.id || !rawPost.file_url) {
            throw new Error(
                'Missing required fields in raw post data: id, file_url'
            );
        }

        const tags: BooruTag[] = (rawPost.tags ?? '')
            .split(' ')
            .filter(Boolean)
            .map((name) => ({ name, count: null, type: null }));

        const originalFile: BooruImage = {
            url: rawPost.file_url,
            width: this.toNumber(rawPost.width),
            height: this.toNumber(rawPost.height),
        };

        const previewFile: BooruImage | null = rawPost.preview_url
            ? {
                  url: rawPost.preview_url,
                  width: this.toNumber(rawPost.preview_width),
                  height: this.toNumber(rawPost.preview_height),
              }
            : null;

        return {
            createdAt: rawPost.date ?? null,
            available: true,
            originalFile,
            previewFile,
            sampleFile: null,
            id: rawPost.id,
            rating: this.parseRating(rawPost.rating),
            score: this.toNumber(rawPost.score) ?? 0,
            tags,
            mediaType: this.inferMediaType(rawPost.file_name),
            owner: rawPost.author || null,
            source: rawPost.source || null,
        };
    }

    public parse(rawPosts: any): BooruPost[] {
        if (!Array.isArray(rawPosts)) {
            throw new Error('Invalid raw post data: expected an array');
        }

        return rawPosts.map((rawPost) => this.parseSingle(rawPost));
    }
}
