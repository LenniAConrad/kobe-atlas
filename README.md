# Thor’s Kobe Spatial Atlas

Created by 赵常许 Thor (T Matsui).

Interactive maps of Kobe’s history, geology and urban planning.

Visit https://LenniAConrad.github.io/kobe-atlas/

This repository contains the published static visitor edition. It has no editing server, private drafts, source archives or local tile cache. Map imagery loads from credited external providers; vectors, event images and artwork are included. Source and image attribution records are retained under `data/` and `source-docs/`.

Updates are built with `python scripts/build_pages.py` in the separate editable project, then copied here and committed to `main`. GitHub Pages publishes the repository root.

The Nushima extension is maintained in this repository. Preserve `js/nushima.js`, `nushima.css`, the integration changes in `js/app.js`, `js/map.js` and `index.html`, and the Nushima records in `data/content.json` when refreshing from that separate project.

The default view opens Nushima; `#home` opens the Kobe timeline. The Nushima tab has 54 independent layer switches with opacity, source details and search. It includes GSI aerial/terrain maps, MLIT land-use and facility extracts, hazard-portal layers, GSI evacuation sites, and MAFF's 2023 fishing-community polygons. MAFF's four named communities and its separate “other area” category support hover details, keyboard focus, and tap/click popups. Remote imagery needs a network connection; a blank tile can mean missing coverage. Source dates are not claims of current conditions.

Provenance and coverage checks: [`data/nushima-sources.json`](data/nushima-sources.json). MAFF's original identifiers, archive checksum, licence and processing record: [`data/nushima/maff-source.json`](data/nushima/maff-source.json). Some older MLIT datasets have non-commercial reuse terms, recorded with their layers. The catalogue records the sources inspected and gaps; it does not claim to exhaust every government dataset or historical edition.

To preview, run `python3 -m http.server 8765`. For browser regression checks, run `npm ci`, `npx playwright install chromium`, then `npm test`. To use an installed Chromium instead, run `CHROMIUM_PATH=/usr/bin/chromium npm test`. Tests use local tile fixtures; provider availability is checked separately in the source audit.

To reproduce the vector extracts, install `scripts/requirements-gis.txt` in a virtual environment. Download the archives listed under `mlitCatalog[].selectedDownload` in the source record, unpack each under a directory named for its dataset ID, and run `python scripts/extract_nushima.py RAW_DIRECTORY`. To reproduce MAFF's polygons, download the archive in `maff-source.json` and run `python scripts/extract_maff_nushima.py MB0001_2023_28.zip`. The scripts preserve source attributes and record how geometry was processed. Full archives stay outside the published repository.
