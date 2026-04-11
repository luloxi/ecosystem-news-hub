# Ecosystem News Hub

A lightweight static dashboard for tracking:
- Midnight Network
- Cardano
- Midnight City
- Input Output Global
- Intersect
- Charles Hoskinson

It builds a `data/news.json` file from public RSS search feeds, then serves a polished static UI that can be deployed to GitHub Pages.

## Local development

```bash
npm install
npm run fetch
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Refresh data

```bash
npm run fetch
```

## Deploy on GitHub Pages

This repo includes a GitHub Actions workflow that:
1. refreshes `data/news.json`
2. uploads the static site as a Pages artifact
3. deploys it to GitHub Pages

It also runs on a schedule so the page stays fresh.
