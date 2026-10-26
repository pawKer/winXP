# WinXP

🏁 Web based Windows XP desktop recreation.

Features:

- Drag and resize, minimize, maximize windows
- Open applications from desktop icons or start menu
- Minesweeper, Internet Explorer, My Computer, Notepad, Winamp, Paint
- Power off menu

## Site content and SEO

The production build runs `scripts/generate-pages.js` after Create React App. It
creates HTML for `/`, `/music`, both published release pages, `/notes`, and the
four note URLs. These pages contain readable content and links before JavaScript
loads; the XP desktop appears after React starts. Visitors can switch to the
reading view with the visible button. The build also creates `sitemap.xml` and
`robots.txt`. Run `yarn test:seo` after `yarn build` to check generated output.

Edit `src/content/site.js` to update the profile, official links, release
descriptions, artwork, dates, credits, or notes. Release records already have
empty `artwork`, `releaseDate`, and `credits` fields to fill in. Edit
`src/content/noteSections.js` for note resource lists. Only the two releases
with existing public listening links have pages; Winamp drafts stay in the
playlist.

The canonical host is `https://reshra.xyz`. nginx redirects the `www` host to
it and serves generated HTML at extensionless paths. Cloudflare must also
redirect HTTP to HTTPS, and its crawler, caching, and robots settings need
verification after deployment. Search Console and Bing property setup and
baseline measurements require access to those accounts.

## [Try it!](https://winxp.now.sh)

Windows XP 👉 https://winxp.now.sh

[![](demo/demo.gif)](https://winxp.now.sh)

## Contributing

Generally open an issue (or comment on an issue if there's one already) before starting work on a PR.

## License

The Windows XP name, artwork, trademark are surely property of Microsoft. This project is provided for educational purposes only. It is not affiliated with and has not been approved by Microsoft.

## Thanks
- [Webamp](https://github.com/captbaritone/webamp), Winamp 2 reimplementation by: [captbaritone](https://github.com/captbaritone)
- [JS Paint](https://github.com/1j01/jspaint), Paint reimplementation by: [1j01](https://github.com/1j01)
