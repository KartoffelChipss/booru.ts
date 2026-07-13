import {
    BooruImage,
    BooruMediaType,
    BooruPost,
    BooruRating,
    BooruTag,
    BooruTagType,
} from '../types';
import { PostsParser } from './PostsParser';

export class DanbooruPostsParser implements PostsParser {
    private static readonly VIDEO_EXTENSIONS = new Set([
        'mp4',
        'webm',
        'mov',
        'm4v',
    ]);
    private static readonly ANIMATED_EXTENSIONS = new Set(['gif', 'apng']);

    private inferMediaType(fileExt: any): BooruMediaType {
        const ext = typeof fileExt === 'string' ? fileExt.toLowerCase() : null;
        if (ext && DanbooruPostsParser.VIDEO_EXTENSIONS.has(ext))
            return 'video';
        if (ext && DanbooruPostsParser.ANIMATED_EXTENSIONS.has(ext))
            return 'animated';
        return 'image';
    }

    private parseRating(rating: any): BooruRating {
        switch (rating) {
            case 'g':
                return 'safe';
            // Danbooru's "sensitive" (s) sits between general and
            // questionable with no equivalent bucket in BooruRating.
            case 's':
            case 'q':
                return 'questionable';
            case 'e':
                return 'explicit';
            default:
                return 'unrated';
        }
    }

    private parseTagString(tagString: any, type: BooruTagType): BooruTag[] {
        if (typeof tagString !== 'string' || tagString.length === 0) return [];
        return tagString
            .split(' ')
            .filter(Boolean)
            .map((name) => ({ name, count: null, type }));
    }

    private findVariant(rawPost: any, type: string): BooruImage | null {
        const variants = rawPost.media_asset?.variants;
        if (!Array.isArray(variants)) return null;
        const variant = variants.find((v: any) => v.type === type);
        if (!variant) return null;
        return {
            url: variant.url,
            width: variant.width ?? null,
            height: variant.height ?? null,
        };
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

        const fileUrl =
            rawPost.file_url ??
            rawPost.large_file_url ??
            rawPost.preview_file_url;
        if (!fileUrl) {
            throw new Error(
                'Missing required fields in raw post data: file_url'
            );
        }

        const previewVariant = this.findVariant(rawPost, '180x180');
        const sampleVariant = this.findVariant(rawPost, 'sample');

        const tags: BooruTag[] = [
            ...this.parseTagString(rawPost.tag_string_general, 'general'),
            ...this.parseTagString(rawPost.tag_string_artist, 'artist'),
            ...this.parseTagString(rawPost.tag_string_copyright, 'copyright'),
            ...this.parseTagString(rawPost.tag_string_character, 'character'),
            ...this.parseTagString(rawPost.tag_string_meta, 'metadata'),
        ];

        return {
            createdAt: rawPost.created_at ?? null,
            // Restricted/pending posts omit file_url even though the post itself exists.
            available: Boolean(rawPost.file_url),
            originalFile: {
                url: fileUrl,
                width: rawPost.image_width ?? null,
                height: rawPost.image_height ?? null,
            },
            previewFile: rawPost.preview_file_url
                ? {
                      url: rawPost.preview_file_url,
                      width: previewVariant?.width ?? null,
                      height: previewVariant?.height ?? null,
                  }
                : null,
            sampleFile: rawPost.large_file_url
                ? {
                      url: rawPost.large_file_url,
                      width: sampleVariant?.width ?? null,
                      height: sampleVariant?.height ?? null,
                  }
                : null,
            id: String(rawPost.id),
            rating: this.parseRating(rawPost.rating),
            score: Number(rawPost.score) || 0,
            tags,
            mediaType: this.inferMediaType(rawPost.file_ext),
            owner:
                rawPost.uploader_id !== undefined &&
                rawPost.uploader_id !== null
                    ? String(rawPost.uploader_id)
                    : null,
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
