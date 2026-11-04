# PACA BETA — change notes

## UI
- The title is `파카난독화기` with an adjacent `BETA` label.
- The separate Anti-Tamper control has been removed.
- The interface uses PACA branding, rounded panels, and a compact browser-processing indicator.
- Downloaded output is named `PACA_BETA_obfuscated.luau`.

## Engine
- The old Prometheus and Obscura application paths have been removed from this build.
- The web app uses the MIT-licensed Clyde Roblox Luau lexer, parser, AST transformer/printer, bytecode compiler, and VM generator.
- The bundle step creates a browser-only entry point; it does not expose the upstream Express UI or CLI.
- The upstream Clyde ASCII watermark is suppressed and the generated file receives a PACA BETA comment.

## Built-in integrity check
- There is no separate Anti-Tamper toggle.
- Medium and Strong VM presets both enable the VM code-hash integrity check.
- Medium disables selected expensive VM transformations; Strong keeps the full maximum profile.
- The upstream check compares a hash of the generated VM instruction array and clears the VM handler table when the comparison fails. This is an integrity check, not a guarantee against every possible runtime modification.

## Language scope
- This build targets Roblox Luau.
- It is not a single parser for Lua 5.1, 5.2, 5.3, 5.4, LuaJIT, and Luau simultaneously; those dialects differ.
- Upstream Clyde describes its parser as supporting the full Luau grammar. PACA CI runs representative syntax/compiler cases, but that does not prove every edge case or runtime behavior. Test protected output in Roblox Studio.

## Verification status for this archive
- Static JSON/YAML validation passed.
- JavaScript build-script syntax checks passed.
- TypeScript/TSX source syntax parsing passed.
- The full dependency install, upstream engine build, PACA Vite build, and engine smoke test were not run in this container. The GitHub Actions workflow performs those steps after push; its result is the actual build verification.
