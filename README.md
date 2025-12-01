# Lestyle Shopify Theme

## Overview
- Shopify theme for Lestyle Boutique built with Online Store 2.0 sections, blocks, and JSON settings.
- Provides responsive layouts, rich merchandising sections, and multi‑language support via `locales/`.
- Designed for direct use with Shopify CLI: develop locally, preview, and push to your store.

## Prerequisites
- A Shopify store (`ibz8cg-h5.myshopify.com`) with collaborator access or staff account.
- Shopify CLI installed on your machine. Install via npm: `npm i -g @shopify/cli @shopify/theme`.
- Git installed for version control.

## Quick Start
- Clone the repository into your workspace.
- Log in to your store: `shopify login --store ibz8cg-h5.myshopify.com`.
- Start a local preview: `shopify theme dev`.
  - The CLI prints a preview URL and creates a development theme in your store.
- Open the URL in your browser to view changes live.

## Development
- Preview locally: `shopify theme dev`
  - Watches files and hot‑reloads changes in your dev theme.
- Pull from a remote theme: `shopify theme pull --theme <THEME_ID>`
  - Keeps local files in sync with a selected theme.
- Push changes: `shopify theme push --theme <THEME_ID>`
  - Uploads local changes to your dev or production theme.
- Validate Liquid and theme structure (optional): install Theme Check `gem install theme-check`, then run `theme-check`.

## Theme Structure
- `layout/` — Global wrappers and `<head>` assets (e.g., `theme.liquid`, `password.liquid`).
- `templates/` — Entry templates for pages and JSON templates for assigning sections.
- `sections/` — Modular, configurable content blocks (e.g., `image-with-text-*.liquid`, `collection-tabs.liquid`, `brands-list.liquid`).
- `snippets/` — Reusable UI fragments (e.g., `header-logo.liquid`, `responsive-image.liquid`, `product-form.liquid`).
- `assets/` — Theme JS, CSS, images, and SVGs (e.g., `theme-global.js`, `main.css`).
- `config/` — Theme settings and presets (`settings_schema.json`, `settings_data.json`, market configuration).
- `locales/` — Translation files for multiple languages (e.g., `en.default.json`, `fr.json`, `zh-CN.json`).
- `blocks/` — Additional block presets used by certain sections.

## Customization
- Use Shopify Theme Editor to configure sections, colors, typography, and layouts.
- Brand assets:
  - Header logo and variants live in `snippets/header-logo.liquid` and header settings.
  - Global styles in `assets/main.css` and section‑specific CSS in `assets/*`. 
  - To add safe custom CSS that persists across updates, use `assets/custom.css.liquid`.
- Content and merchandising:
  - Add or reorder home page sections in `templates/index.json` (or via Theme Editor).
  - Collections and product presentation leverage `sections/collection-*.liquid` and `snippets/product-*`.
- Settings schema:
  - Define configurable options in `config/settings_schema.json`; values are stored in `config/settings_data.json` per theme instance.

## Internationalization
- Translations are managed under `locales/`.
- Add or edit strings in `en.default.json` and propagate to other locale files as needed.

## Deployment
- Create a new unpublished theme and push: `shopify theme push --unpublished`
- Set as live from the Shopify admin when ready, or push directly to the live theme ID:
  - `shopify theme push --theme <LIVE_THEME_ID>`
- Always test on a development theme before publishing.

## Troubleshooting
- Authentication issues: re‑run `shopify login --store your-store.myshopify.com`.
- Missing preview URL: stop other CLI instances and run `shopify theme dev` again.
- Liquid errors: run `theme-check` and check the Shopify admin error logs.

## Contributing
- Use feature branches and pull requests.
- Keep changes focused and documented in commit messages.
- Follow existing Liquid, CSS, and JS conventions present in the codebase.
