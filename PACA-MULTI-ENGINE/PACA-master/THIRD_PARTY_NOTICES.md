# Third-party notices

## Obscura Luau engine

PACA's Luau backend fetches and bundles the upstream `vo3pal/obscura` source during the GitHub Pages build.

- Project: https://github.com/vo3pal/obscura
- License: MIT
- Copyright: Copyright (c) 2026 Obscura Contributors
- The upstream MIT license text is retained in `third_party/obscura/LICENSE` in the build checkout.

PACA uses the upstream parser, AST, transformation layers, and VM compiler through a browser-hosted Pyodide runtime. Those components are not represented as independently authored PACA code.

## Existing Lua 5.1 backend

The Lua 5.1 backend retains the existing Prometheus-derived modules in `src/prometheus`. Their upstream attribution/comments remain in place. Review the upstream repository's applicable license and attribution requirements before redistributing modified versions.
