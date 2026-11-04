# PACA Obfuscator

PACA is a browser-based Lua/Luau obfuscator with two separate engines:

- **Luau:** It was created by a creator named Alpha and is currently in beta. 
- **Lua 5.1:** the existing Prometheus-derived Lua pipeline running through Wasmoon.

## GitHub Pages build

The deployment workflow checks out `vo3pal/obscura` into `third_party/obscura`, bundles its Python modules into the web worker, builds the Vite application, and deploys `web/dist` to GitHub Pages.

The Obscura source is included at build time rather than copied into this archive. A local build must first place the upstream repository at `third_party/obscura`:

```sh
git clone https://github.com/vo3pal/obscura.git third_party/obscura
pnpm install --frozen-lockfile
pnpm run web:build
```

The first Luau run downloads the pinned Pyodide runtime (`0.29.5`) from jsDelivr. Source text is processed in the browser worker; it is not sent to a PACA server.

## Engine mapping

| UI language | Engine | Presets |
|---|---|---|
| Luau | Obscura | Minify, Weak, Medium, Strong (Strong selects the VM profile) |
| Lua 5.1 | Prometheus-derived pipeline | Existing presets |

Obscura documents a supported subset of Luau rather than the entire language. A parser error from that engine means the source uses syntax outside that supported subset or has a source-level syntax error. Generated output is parsed again before it is returned, but that is a syntax check, not proof of runtime equivalence. Test the output in Roblox Studio before using it.

See `THIRD_PARTY_NOTICES.md` for attribution and licensing notes.
