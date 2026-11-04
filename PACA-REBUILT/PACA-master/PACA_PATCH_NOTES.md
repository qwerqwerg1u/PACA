# PACA rebuild patch notes

This package is a compatibility/performance patch over the supplied PACA project, not a newly authored VM engine.

## Changes
- Default Lua target is now Luau, matching Roblox-oriented input.
- The web app detects common Luau-only syntax (`continue`, compound assignments, and `::`) and switches the run to Luau automatically.
- Browser obfuscation timeout increased from 90 to 180 seconds for larger inputs.
- Strong preset no longer runs the expensive VMify pass twice.
- Browser output includes a PACA watermark and downloads as `paca.obfuscated.lua`.
- Web page title changed to PACA Obfuscator.
- Preview base path corrected to `/PACA/`.

## Important
The obfuscation engine is still based on the upstream Prometheus project. Its original source/license notices are retained. This patch does not claim a brand-new VM architecture, and a full production build/test was not run in this environment. Test your own scripts in a safe test place before relying on the output.
