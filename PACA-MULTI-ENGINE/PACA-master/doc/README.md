---
description: PACA is a dual-engine Lua and Luau obfuscator.
---

# PACA Documentation

PACA uses a separate Luau engine (Obscura) and Lua 5.1 engine (the retained Prometheus-derived pipeline).

Use the PACA web interface to transform Luau and Lua 5.1 source in the browser. Luau uses Obscura through Pyodide; Lua 5.1 uses the existing Prometheus-derived pipeline.

This documentation covers:

- supported language targets and engine selection
- configuration and presets
- the Luau and Lua 5.1 processing paths
- third-party attribution and limitations

## Who this is for

- developers who need a local browser-based Lua/Luau transformation workflow
- users integrating PACA with a GitHub Pages build pipeline

## Supported language targets

- Lua 5.1 (`Lua51`)
- LuaU (`LuaU`)

## Read in this order

1. Installation
2. Quickstart
3. CLI Usage
4. Presets
5. Custom Config
6. Step Reference
