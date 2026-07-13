export interface BooruAutoCompleteResult {
    label: string;
    value: string;
}

export type BooruSort = 'score' | 'created' | 'random';
export const BOORU_SORTS: BooruSort[] = ['score', 'created', 'random'];
export function isBooruSort(value: any): value is BooruSort {
    return BOORU_SORTS.includes(value);
}

export type BooruSortOrder = 'asc' | 'desc';

export interface BooruSearchOptions {
    tags?: string[];
    sort?: BooruSort;
    sortOrder?: BooruSortOrder;
    limit?: number;
    page?: number;
}

export interface MaxTags {
    /**
     * The maximum number of tags that can be used in a search query for unauthenticated users.
     */
    unauthenticated: number;
    /**
     * The maximum number of tags that can be used in a search query for authenticated users.
     */
    authenticated: number;
}

export type BooruMediaType = 'image' | 'video' | 'animated';

export type BooruRating = 'safe' | 'questionable' | 'explicit' | 'unrated';
const BOORU_RATINGS: BooruRating[] = [
    'safe',
    'questionable',
    'explicit',
    'unrated',
];
export function isBooruRating(value: any): value is BooruRating {
    return BOORU_RATINGS.includes(value);
}

export type BooruTagType =
    'general' | 'artist' | 'copyright' | 'character' | 'metadata';

export interface BooruImage {
    url: string;
    width: number | null;
    height: number | null;
}

export interface BooruTag {
    name: string;
    count: number | null;
    type: string | null;
}

export interface BooruPost {
    createdAt: string | null;
    available: boolean;
    originalFile: BooruImage;
    previewFile: BooruImage | null;
    sampleFile: BooruImage | null;
    id: string;
    rating: BooruRating;
    score: number;
    tags: BooruTag[];
    mediaType: BooruMediaType;
    owner: string | null;
    source: string | null;
}
