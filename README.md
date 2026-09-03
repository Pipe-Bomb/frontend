<h1>
    <img src="https://raw.githubusercontent.com/Pipe-Bomb/.github/refs/heads/master/assets/logos/Pipe%20Bomb%20no%20background%20w%20outline.png" width="40" />
    Pipe Bomb Frontend
</h1>

The officially maintained frontend for [Pipe Bomb server](https://github.com/pipe-bomb/server), built on Next.js. This is by no means the only way to use Pipe Bomb, but it is a good one 😛.

## Getting Started

Full installation instructions for Pipe Bomb are on the [Pipe Bomb Wiki](https://pipebomb.net/wiki/installation). You can also directly run the Pipe Bomb frontend standalone using the following instructions:

Pipe Bomb frontend is developed using Node.js 24. Clone the repository, then run:

```bash
npm ci
npm run build
npm run start
```

If you experience a port conflict, run the frontend on a different port using the `PORT` environment variable:

```bash
PORT=3001 npm run start
```

The server address that Pipe Bomb frontend uses can also be configured using environment variables. `INTERNAL_API_URL` is used in server-side rendering and `NEXT_PUBLIC_API_URL` is used by the browser.

## Attributes

Pipe Bomb's attribute system is very dynamic and has no defaults, leaving all naming decisions to plugin developers. That being said, Pipe Bomb frontend gives a few attributes special treatment:

### Track

| Attribute | Type             | Multiple | Description                                                           |
| :-------- | ---------------- | -------- | --------------------------------------------------------------------- |
| `title`   | `string`         | ❌       | Used as the main title for the track in lists and on track pages.     |
| `artist`  | `string`         | ✅       | Used as the artist text when a track has no links to artist entities. |
| `front`   | `buffer` (image) | ❌       | Used as the main cover art for the track in lists and on track pages. |

### Album

| Attribute | Type             | Multiple | Description                                                           |
| :-------- | ---------------- | -------- | --------------------------------------------------------------------- |
| `title`   | `string`         | ❌       | Used as the main title for the album in lists and on album pages.     |
| `artist`  | `string`         | ✅       | Used as the artist text when a album has no links to artist entities. |
| `front`   | `buffer` (image) | ❌       | Used as the main cover art for the album in lists and on album pages. |

### Artist

| Attribute    | Type             | Multiple | Description                                                                                                      |
| :----------- | ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `name`       | `string`         | ❌       | Used as the main title for the artist on artist pages or in track or album credits.                              |
| `thumb`      | `buffer` (image) | ❌       | Used as the front image for the artist on artist pages. Also used as the image for the artist in search results. |
| `background` | `buffer` (image) | ❌       | Used as the background image for the artist on artist pages.                                                     |
| `logo`       | `buffer` (image) | ❌       | Overlayed on top of the background image on artist pages.                                                        |

## Credits & Contributing

Pipe Bomb is conceptualised and developed by [eyezah](https://github.com/eyezahhhh), but contributions are welcome!
