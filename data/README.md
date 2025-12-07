# Data Directory

This folder contains the WCAG data source for the MCP server.

## wcag-as-json (Git Submodule)

The `wcag-as-json/` directory is a git submodule pointing to [tenon-io/wcag-as-json](https://github.com/tenon-io/wcag-as-json).

It contains WCAG 2.2 guidelines and success criteria in JSON format (`wcag.json`).

### Updating the Data

To pull the latest data from the upstream repository:

```bash
npm run update-wcag
```

Or manually:

```bash
git submodule update --remote data/wcag-as-json
```

### Attribution

WCAG data from [wcag-as-json](https://github.com/tenon-io/wcag-as-json) (MIT License).

> This software includes material copied from or derived from Web Content Accessibility Guidelines (WCAG) 2.2 https://www.w3.org/TR/WCAG22/. Copyright © 2023 W3C® (MIT, ERCIM, Keio, Beihang).