#!/bin/sh
# Deploy the static site to Cloudflare Workers static assets (rlr-memorial-site, swimpass.app account).
# Only the web assets go up — not the Dockerfile, nginx.conf or the contact worker.
set -eu
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp -R index.html style.css script.js favicon.svg og-image.png og-image.svg robots.txt sitemap.xml _headers photos dist/
set -a; . "$HOME/.config/ryan-ops/cloudflare.env"; set +a
wrangler deploy
