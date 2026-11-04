# Third-party notices

## Clyde Luau parser and VM

- Repository: https://github.com/sfr-development/Lua-Obfuscator-Clyde-Protection
- License: MIT
- Copyright notice: Copyright (c) 2025 Clyde
- Full license text: `THIRD_PARTY_CLYDE_LICENSE.txt`
- Used components: lexer, parser, AST transformations, bytecode compiler, and VM generator

PACA wraps and integrates this upstream implementation. These components are not represented as independently authored PACA code. The upstream license and attribution terms apply. The deployment workflow fetches the upstream source, compiles it, and bundles the generated modules; the license text is also included in this repository archive.

## PACA-specific code

The PACA UI, worker integration, output branding, bundling workflow, smoke tests, and repository configuration are maintained in this repository.
