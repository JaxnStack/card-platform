MCP server configs for this repository

This folder contains simple MCP-style server entries used by developer tooling or local managed copilots.

Files:
- servers/playwright.yml — Playwright test runner configuration
- servers/supabase.yml — Supabase local emulator configuration
- servers/browser.yml — Headless Chromium launcher for remote debugging

Notes for copilots:
- Use `supabase start` to boot a local Supabase emulation when testing multiplayer features.
- Start Playwright tests with `npx playwright test`. Use Playwright Docker images for isolated runs.
- For browser-based tests, ensure a headless Chromium is available or use the Playwright Docker image which bundles browsers.

If you want different ports, docker images, or a Compose/service definition, say which platform/CI to target and a more specific config will be generated.