# Data Directory

This folder contains the WCAG data sources for the MCP server.

## Data Files

- **`wcag.json`** - WCAG 2.2 principles, guidelines, success criteria, techniques, glossary, and Understanding documentation (enhanced with content from W3C)

## wcag (Git Submodule)

The `wcag/` directory is a git submodule pointing to [w3c/wcag](https://github.com/w3c/wcag), the official W3C WCAG repository. This provides the Understanding documentation HTML files.

### Updating the Data

To fetch the latest data:

```bash
npm run build
```

This will:
1. Update the WCAG git submodule to the latest version
2. Fetch the published `wcag.json` from W3C
3. Parse and integrate Understanding documentation from HTML files

To also update the submodule to the latest commit:

```bash
npm run update:data
```

### Attribution

WCAG data from the [W3C WCAG Repository](https://github.com/w3c/wcag) ([W3C Document License](https://www.w3.org/copyright/document-license/)).

> This software includes material copied from or derived from Web Content Accessibility Guidelines (WCAG) 2.2 https://www.w3.org/TR/WCAG22/. Copyright © 2023 W3C® (MIT, ERCIM, Keio, Beihang).