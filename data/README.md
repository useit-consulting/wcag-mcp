# Data Directory

This folder contains the WCAG data sources for the MCP server.

## Data Files

- **`wcag.json`** - WCAG 2.2 principles, guidelines, success criteria, techniques, and glossary (fetched from W3C)
- **`act-rules.json`** - ACT (Accessibility Conformance Testing) test rules (copied from submodule)

## wcag (Git Submodule)

The `wcag/` directory is a git submodule pointing to [w3c/wcag](https://github.com/w3c/wcag), the official W3C WCAG repository.

### Updating the Data

To fetch the latest data:

```bash
npm run build:data
```

This will:
1. Fetch the published `wcag.json` from W3C
2. Copy the ACT rules mapping from the submodule

To also update the submodule to the latest commit:

```bash
npm run update:data
```

### Attribution

WCAG data from the [W3C WCAG Repository](https://github.com/w3c/wcag) ([W3C Document License](https://www.w3.org/copyright/document-license/)).

> This software includes material copied from or derived from Web Content Accessibility Guidelines (WCAG) 2.2 https://www.w3.org/TR/WCAG22/. Copyright © 2023 W3C® (MIT, ERCIM, Keio, Beihang).