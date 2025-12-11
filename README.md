# wcag-mcp

**WCAG MCP Server for Agentic Systems** - Powered by Official W3C Data with Full Understanding Documentation

A Model Context Protocol (MCP) server providing comprehensive access to WCAG 2.2 guidelines, techniques, glossary terms, and **complete Understanding documentation** for every success criterion. Works both locally (stdio) and remotely (Netlify Functions).

## Features

- **Complete WCAG 2.2 Coverage** - All 87 success criteria with full details
- **Full Understanding Documentation** - Intent, benefits, examples, and resources for every SC
- **Techniques Library** - 400+ techniques (sufficient, advisory, failure patterns)
- **Glossary** - 101 official WCAG term definitions
- **Version Tracking** - See what's new in WCAG 2.2

## What's New: Understanding Documentation

This server now includes **complete Understanding documentation** parsed from the official W3C WCAG Understanding documents. For every success criterion, you get:

- **Brief Summary** - Goal, what to do, and why it's important
- **Intent** - Detailed explanation of the purpose and rationale
- **Benefits** - Who benefits and how
- **Examples** - Real-world examples of implementation
- **Resources** - Curated list of tools and references

No more following external links - everything you need is right in the MCP response!

## Available Tools (19 total)

## Features

- **Complete WCAG 2.2 Coverage** - All 87 success criteria with full details
- **Full Understanding Documentation** - Intent, benefits, examples, and resources for every SC
- **Techniques Library** - 400+ techniques (sufficient, advisory, failure patterns)
- **ACT Test Rules** - 87+ standardized accessibility test rules
- **Glossary** - 101 official WCAG term definitions
- **Version Tracking** - See what's new in WCAG 2.2

## What's New: Understanding Documentation

This server now includes **complete Understanding documentation** parsed from the official W3C WCAG Understanding documents. For every success criterion, you get:

- **Brief Summary** - Goal, what to do, and why it's important
- **Intent** - Detailed explanation of the purpose and rationale
- **Benefits** - Who benefits and how
- **Examples** - Real-world examples of implementation
- **Resources** - Curated list of tools and references

No more following external links - everything you need is right in the MCP response!

## Available Tools (20 total)

### Core WCAG Tools

| Tool | Description |
|------|-------------|
| `list-principles` | Lists all four WCAG 2.2 principles (Perceivable, Operable, Understandable, Robust) |
| `list-guidelines` | Lists WCAG 2.2 guidelines, optionally filtered by principle number (1-4) |
| `list-success-criteria` | Lists success criteria with optional filters by level (A/AA/AAA), guideline, or principle |
| `get-success-criteria-detail` | Gets just the normative success criterion text and exceptions without Understanding docs |
| `get-criterion` | Gets comprehensive details including full Understanding documentation (intent, benefits, examples) |
| `get-guideline` | Gets full details for a specific guideline including all its success criteria |
| `search-wcag` | Searches success criteria by keyword in titles and descriptions |
| `get-criteria-by-level` | Gets all criteria for a conformance level, optionally including lower levels |
| `count-criteria` | Returns counts of success criteria grouped by level, principle, or guideline |

### Technique Tools

| Tool | Description |
|------|-------------|
| `list-techniques` | Lists techniques, filter by technology (html, aria, css, pdf, general) or type |
| `get-technique` | Gets details for a specific technique by ID (e.g., "H37", "ARIA1", "G94") |
| `get-techniques-for-criterion` | Gets all techniques (sufficient, advisory, failure) for a success criterion |
| `search-techniques` | Searches techniques by keyword |
| `get-failures-for-criterion` | Gets failure patterns (common mistakes) for a success criterion |

### Glossary Tools

| Tool | Description |
|------|-------------|
| `get-glossary-term` | Gets the definition of a WCAG term (e.g., "programmatically determined") |
| `list-glossary-terms` | Lists all 101 WCAG glossary terms |
| `search-glossary` | Searches the glossary by keyword |

### Enhanced Context Tools

| Tool | Description |
|------|-------------|
| `whats-new-in-wcag22` | Lists all 9 success criteria added in WCAG 2.2 |
| `get-full-criterion-context` | Gets comprehensive context: SC + techniques |
| `get-server-info` | Returns server information and statistics |

## Data Source

This server uses official data from the [W3C WCAG Repository](https://github.com/w3c/wcag):

- **WCAG JSON**: [Published WCAG 2.2 JSON](https://www.w3.org/WAI/WCAG22/wcag.json)
- **Understanding Docs**: Parsed from official W3C Understanding HTML files in the submodule

### Statistics

- **4 Principles** - Perceivable, Operable, Understandable, Robust
- **13 Guidelines** - Organized under principles
- **87 Success Criteria** - Levels A (32), AA (24), AAA (31)
- **400+ Techniques** - HTML, ARIA, CSS, PDF, General, and more
- **101 Glossary Terms** - Official WCAG definitions

## Installation

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/joe-watkins/wcag-mcp.git
cd wcag-mcp

# Install dependencies and build data (automatically fetches WCAG data and Understanding docs)
npm install
```

### Updating WCAG Data

To pull the latest WCAG data and Understanding documentation:

```bash
# Update submodule, fetch latest data from W3C, and parse Understanding docs
npm run build
```

The build process:
1. Updates the W3C WCAG git submodule to the latest version
2. Fetches the latest WCAG 2.2 JSON data from W3C
3. Parses all Understanding documentation from HTML files

This runs automatically during `npm install`.

### Configure your IDE

Add this to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "wcag-mcp": {
      "command": "node",
      "args": ["<path to installed mcp>/wcag-mcp/src/index.js"]
    }
  }
}
```

## Deploy to Netlify

This project is configured to deploy as a Netlify Function.

### Deploy via GitHub

1. Push this repository to GitHub
2. Connect it to Netlify via the Netlify dashboard
3. Netlify will automatically build and deploy

### Using the Remote Server

Once deployed, configure your Claude Desktop MCP settings to use the remote server:

```json
{
  "mcpServers": {
    "wcag-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["mcp-remote@next", "https://your-site.netlify.app/mcp"]
    }
  }
}
```

Replace `your-site.netlify.app` with your actual Netlify URL.

## Project Structure

```
wcag-mcp/
├── data/
│   ├── wcag/                    # W3C WCAG submodule (includes Understanding docs)
│   │   └── understanding/       # Understanding HTML files by WCAG version
│   │       ├── 20/              # WCAG 2.0 Understanding docs
│   │       ├── 21/              # WCAG 2.1 Understanding docs
│   │       └── 22/              # WCAG 2.2 Understanding docs
│   └── wcag.json                # Enhanced WCAG data with Understanding content
├── scripts/
│   ├── fetch-wcag-data.js       # Fetch WCAG JSON from W3C
│   └── parse-understanding-docs.js  # Parse Understanding HTML files
├── src/
│   ├── index.js                 # MCP server with stdio transport
│   ├── tools.js                 # Tool definitions (19 tools)
│   └── data-helpers.js          # Data access utilities
├── netlify/
│   └── functions/api.js         # Netlify Function handler
└── package.json
```

## Attribution

WCAG data from the [W3C WCAG Repository](https://github.com/w3c/wcag) ([W3C Document License](https://www.w3.org/copyright/document-license/)).

> This software includes material copied from or derived from Web Content Accessibility Guidelines (WCAG) 2.2 https://www.w3.org/TR/WCAG22/. Copyright © 2023 W3C® (MIT, ERCIM, Keio, Beihang).

## License

MIT

## Learn More

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [WCAG 2.2 Specification](https://www.w3.org/TR/WCAG22/)
- [W3C WCAG Repository](https://github.com/w3c/wcag)
- [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
- [Techniques for WCAG 2.2](https://www.w3.org/WAI/WCAG22/Techniques/)
