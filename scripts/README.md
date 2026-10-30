# Repository tools

Run tools through the Yarn commands in `package.json`, from the repository root.

- `content/`: source validation, compilation, watching, post creation, and tests.
- `analytics/`: GA setup, OAuth login, reports, dashboard template, and tests.
- `media/`: audio conversion and web-cover preparation.
- `templates/`: full HTML and discovery-document templates.
- Root scripts: app start/preview, page generation/verification, lint, and
  browser/nginx checks.

The directory layout does not change commands such as `yarn ga4:reports`,
`yarn media:artwork`, or `yarn test:content`. Reports still write to the ignored
`.local/analytics/` directory; media stays under `public/songs/`.
