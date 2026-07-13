# booru.ts

A TypeScript library for interacting with Booru style image board APIs such as Rule34, Safebooru, Danbooru and Paheal. It gives you one consistent interface for searching posts and autocompleting tags, so you do not have to deal with each site's own API quirks yourself.

## Installation

```
npm install booru.ts
```

## Supported sites

- Rule34 (rule34.xxx), requires an API key and user id
- Safebooru (safebooru.org)
- Danbooru (danbooru.donmai.us), login and API key optional, but raise the tag limit
- Paheal (rule34.paheal.net)

## Basic usage

```ts
import { Safebooru } from 'booru.ts';

const site = new Safebooru();

const posts = await site.search({
    tags: ['1girl'],
    sort: 'score',
    sortOrder: 'desc',
    limit: 10,
});

console.log(posts);
```

Each result is a `BooruPost` with fields like `id`, `rating`, `score`, `tags`, `mediaType`, `originalFile`, `previewFile`, `sampleFile`, `owner` and `source`.

## Site specific setup

### Rule34

Rule34 requires an API key and user id for every request. Get them from your account settings on rule34.xxx.

```ts
import { Rule34 } from 'booru.ts';

const site = new Rule34({
    apiKey: 'your-api-key',
    userId: 'your-user-id',
});

const posts = await site.search({ tags: ['1girl'], limit: 5 });
```

### Danbooru

Danbooru works without credentials, but anonymous searches are limited to 2 tags. Passing a login and API key raises that limit.

```ts
import { Danbooru } from 'booru.ts';

const site = new Danbooru();
const authedSite = new Danbooru({
    login: 'your-login',
    apiKey: 'your-api-key',
});

const posts = await authedSite.search({ tags: ['1girl', 'solo'], limit: 5 });
```

### Safebooru and Paheal

Both work without any credentials.

```ts
import { Paheal } from 'booru.ts';

const site = new Paheal();
const posts = await site.search({ tags: ['animated'], limit: 5 });
```

## Search options

The `search` method accepts:

- `tags`, an array of tags to filter by
- `sort`, one of `'score'`, `'created'` or `'random'`
- `sortOrder`, `'asc'` or `'desc'`
- `limit`, the number of posts to return
- `page`, the page number to fetch

Not every site supports every sort mode. Call `site.canSortRandomly()` to check whether random sorting is available before using it.

## Autocomplete

Every site supports tag autocomplete:

```ts
const results = await site.autocomplete('blue');
// [{ label: 'blue_eyes', value: 'blue_eyes' }, ...]
```

## Caching requests

Wrap any site in a `CachedBooruSite` to cache `search` and `autocomplete` results in memory with node-cache, so repeated identical requests are served from the cache instead of hitting the real site again.

```ts
import { CachedBooruSite, Safebooru } from 'booru.ts';

const site = new CachedBooruSite(new Safebooru(), {
    searchTtl: 120,
    autocompleteTtl: 300,
});

await site.search({ tags: ['1girl'] }); // fetched from Safebooru
await site.search({ tags: ['1girl'] }); // served from the cache

site.clearCache();
```

## License

MIT
