import {
    BooruImage,
    BooruMediaType,
    BooruPost,
    BooruRating,
    BooruTag,
} from '../types';
import { PostsParser } from './PostsParser';

export class MoebooruPostsParser implements PostsParser {
    private static readonly VIDEO_EXTENSIONS = new Set([
        'mp4',
        'webm',
        'mov',
        'm4v',
    ]);
    private static readonly ANIMATED_EXTENSIONS = new Set(['gif', 'apng']);

    private inferMediaType(fileExt: any): BooruMediaType {
        const ext = typeof fileExt === 'string' ? fileExt.toLowerCase() : null;
        if (ext && MoebooruPostsParser.VIDEO_EXTENSIONS.has(ext))
            return 'video';
        if (ext && MoebooruPostsParser.ANIMATED_EXTENSIONS.has(ext))
            return 'animated';
        return 'image';
    }

    private parseRating(rating: any): BooruRating {
        switch (rating) {
            case 's':
                return 'safe';
            case 'q':
                return 'questionable';
            case 'e':
                return 'explicit';
            default:
                return 'unrated';
        }
    }

    private parseCreatedAt(createdAt: any): string | null {
        if (typeof createdAt !== 'number') return null;
        return new Date(createdAt * 1000).toISOString();
    }

    private parseTags(tags: any): BooruTag[] {
        if (typeof tags !== 'string' || tags.length === 0) return [];
        return tags
            .split(' ')
            .filter(Boolean)
            .map((name) => ({ name, count: null, type: null }));
    }

    private parseSingle(rawPost: any): BooruPost {
        if (!rawPost || typeof rawPost !== 'object') {
            throw new Error('Invalid raw post data');
        }

        const requiredFields = ['id', 'rating', 'score'];
        if (!requiredFields.every((field) => field in rawPost)) {
            throw new Error(
                `Missing required fields in raw post data: ${requiredFields
                    .filter((field) => !(field in rawPost))
                    .join(', ')}`
            );
        }

        if (!rawPost.file_url) {
            throw new Error(
                'Missing required fields in raw post data: file_url'
            );
        }

        const originalFile: BooruImage = {
            url: rawPost.file_url,
            width: rawPost.width ?? null,
            height: rawPost.height ?? null,
        };

        const previewFile: BooruImage | null = rawPost.preview_url
            ? {
                  url: rawPost.preview_url,
                  width: rawPost.preview_width ?? null,
                  height: rawPost.preview_height ?? null,
              }
            : null;

        const sampleFile: BooruImage | null = rawPost.sample_url
            ? {
                  url: rawPost.sample_url,
                  width: rawPost.sample_width ?? null,
                  height: rawPost.sample_height ?? null,
              }
            : null;

        return {
            createdAt: this.parseCreatedAt(rawPost.created_at),
            available: Boolean(rawPost.file_url),
            originalFile,
            previewFile,
            sampleFile,
            id: String(rawPost.id),
            rating: this.parseRating(rawPost.rating),
            score: Number(rawPost.score) || 0,
            tags: this.parseTags(rawPost.tags),
            mediaType: this.inferMediaType(rawPost.file_ext),
            owner:
                rawPost.creator_id !== undefined && rawPost.creator_id !== null
                    ? String(rawPost.creator_id)
                    : null,
            source: rawPost.source || null,
        };
    }

    public parse(rawPosts: any): BooruPost[] {
        if (!Array.isArray(rawPosts)) {
            throw new Error('Invalid raw post data: expected an array');
        }

        const posts: BooruPost[] = [];
        for (const rawPost of rawPosts) {
            try {
                posts.push(this.parseSingle(rawPost));
            } catch {
                continue;
            }
        }
        return posts;
    }
}
