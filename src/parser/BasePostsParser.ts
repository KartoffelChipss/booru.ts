import {
    BooruImage,
    BooruMediaType,
    BooruPost,
    BooruRating,
    BooruTag,
    BooruTagType,
} from '../types';
import { PostsParser } from './PostsParser';

export class BasePostsParser implements PostsParser {
    private static readonly VIDEO_EXTENSIONS = new Set([
        'mp4',
        'webm',
        'mov',
        'm4v',
    ]);
    private static readonly ANIMATED_EXTENSIONS = new Set(['gif', 'apng']);

    private getFileExtension(url: string): string | null {
        try {
            const pathname = new URL(url).pathname;
            const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
            return match && match[1] ? match[1].toLowerCase() : null;
        } catch {
            // fall back for non-absolute or malformed URLs
            const match = url.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
            return match && match[1] ? match[1].toLowerCase() : null;
        }
    }

    private inferMediaType(fileUrl: string): BooruMediaType {
        const ext = this.getFileExtension(fileUrl);
        if (ext && BasePostsParser.VIDEO_EXTENSIONS.has(ext)) return 'video';
        if (ext && BasePostsParser.ANIMATED_EXTENSIONS.has(ext))
            return 'animated';
        return 'image';
    }

    private parseRating(rating: any): BooruRating {
        switch (rating) {
            case 'safe':
            case 'general':
                return 'safe';
            // "sensitive" has no equivalent bucket in BooruRating; it sits
            // between general and questionable, so treat it as the latter.
            case 'sensitive':
            case 'questionable':
                return 'questionable';
            case 'explicit':
                return 'explicit';
            default:
                return 'unrated';
        }
    }

    private parseTagType(type: any): BooruTagType | null {
        switch (type) {
            case 'tag':
                return 'general';
            case 'artist':
                return 'artist';
            case 'copyright':
                return 'copyright';
            case 'character':
                return 'character';
            case 'metadata':
                return 'metadata';
            default:
                return null;
        }
    }

    private parseSingle(rawPost: any): BooruPost {
        if (!rawPost || typeof rawPost !== 'object') {
            throw new Error('Invalid raw post data');
        }

        const requiredFields = ['id', 'file_url', 'rating', 'score'];
        if (!requiredFields.every((field) => field in rawPost)) {
            throw new Error(
                `Missing required fields in raw post data: ${requiredFields
                    .filter((field) => !(field in rawPost))
                    .join(', ')}`
            );
        }

        const previewImage: BooruImage | null = rawPost.preview_url
            ? {
                  url: rawPost.preview_url,
                  width: null,
                  height: null,
              }
            : null;

        const sampleImage: BooruImage | null = rawPost.sample_url
            ? {
                  url: rawPost.sample_url,
                  width: rawPost.sample_width ?? null,
                  height: rawPost.sample_height ?? null,
              }
            : null;

        const originalImage: BooruImage = {
            url: rawPost.file_url,
            width: rawPost.width ?? null,
            height: rawPost.height ?? null,
        };

        const rating: BooruRating = this.parseRating(rawPost.rating);

        const tags: BooruTag[] = [];
        if (Array.isArray(rawPost.tag_info)) {
            for (const tag of rawPost.tag_info) {
                const parsedType = this.parseTagType(tag.type);
                tags.push({
                    name: tag.tag,
                    count: tag.count ?? null,
                    type: parsedType,
                });
            }
        }
        if (!Array.isArray(rawPost.tag_info) && Array.isArray(rawPost.tags)) {
            for (const tagName of rawPost.tags) {
                tags.push({
                    name: tagName,
                    count: null,
                    type: null,
                });
            }
        }

        return {
            createdAt: null,
            available:
                rawPost.available !== undefined
                    ? Boolean(rawPost.available)
                    : true,
            originalFile: originalImage,
            previewFile: previewImage,
            sampleFile: sampleImage,
            id: String(rawPost.id),
            rating: rating,
            score: Number(rawPost.score) || 0,
            tags,
            mediaType: this.inferMediaType(rawPost.file_url),
            owner: rawPost.owner || null,
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
