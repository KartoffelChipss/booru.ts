import { BooruPost } from '../types';

export interface PostsParser {
    /**
     * Parse a raw list of posts from the Booru API into an array of BooruPost objects.
     * @param rawPost The raw list of posts from the Booru API.
     * @returns An array of BooruPost objects.
     */
    parse(rawPost: any): BooruPost[];
}
