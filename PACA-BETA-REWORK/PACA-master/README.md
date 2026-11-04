# PACA 난독화기 BETA

PACA is a browser-based **Roblox Luau** obfuscation interface. The previous mixed Lua backend has been removed from this web build. PACA now builds against one Luau pipeline so the lexer, parser, AST transforms, bytecode compiler, and VM generator use compatible syntax and node models.

## Build / deploy

The deployment workflow downloads the MIT-licensed upstream Clyde Luau project into `third_party/clyde`, compiles its TypeScript sources, bundles its generated modules into the Vite app, runs syntax/VM smoke tests, runs the upstream test script when tests are present, runs PACA syntax/VM smoke tests, then builds GitHub Pages. The generated browser entry point imports only the lexer, parser, AST transform/printer, bytecode compiler, and VM generator; it does not bundle the upstream Express UI or CLI.

For a local build:

```sh
git clone https://github.com/sfr-development/Lua-Obfuscator-Clyde-Protection.git third_party/clyde
npm ci --prefix third_party/clyde
npm run build --prefix third_party/clyde
pnpm install --frozen-lockfile
node scripts/build-clyde-bundle.mjs
node scripts/smoke-test-clyde.mjs
pnpm --filter web build
```

The app targets Roblox Luau. It is not a universal front end for every incompatible Lua dialect/version (Lua 5.1, 5.2, 5.3, 5.4, LuaJIT, and Luau have different grammars/runtime behavior). The selected parser is the Clyde Luau parser. Its upstream README claims support for type annotations, generics, if-expressions, interpolation, compound assignment, `continue`, type functions, and exported type declarations; PACA's CI smoke test checks representative examples of those features. A parser passing is not proof of runtime equivalence, and VM-protected output must still be tested in Roblox Studio.

## Protection presets

| Preset | Pipeline |
|---|---|
| Minify | Luau parse + AST printer |
| Weak | Scope-aware local renaming + AST printer |
| Medium | VM bytecode + code-hash integrity check, with selected expensive layers disabled |
| Strong | Full maximum VM profile + code-hash integrity check |

There is no standalone Anti-Tamper toggle. Medium and Strong both use the VM backend's maximum VM level because its code-hash integrity check is emitted only at that level. Medium disables selected costly protection layers; Strong keeps the full maximum profile. The check hashes the generated VM instruction array and clears the handler table if the hash differs. The output comment is PACA-branded; upstream attribution is retained in `THIRD_PARTY_NOTICES.md` and `THIRD_PARTY_CLYDE_LICENSE.txt`.

## Privacy

Source is processed in the browser worker. This repository does not send source text to a PACA server. GitHub Pages serves the static app and the browser downloads the compiled PACA site assets.
