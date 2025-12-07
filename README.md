# wcag-mcp

WCAG MCP server for agentic systems

A Model Context Protocol (MCP) server providing access to WCAG 2.2 guidelines and success criteria. Works both locally (stdio) and remotely (Netlify Functions).

## Available Tools

This server provides tools for querying WCAG 2.2 data:

| Tool | Description |
|------|-------------|
| `list-principles` | Lists all four WCAG 2.2 principles (Perceivable, Operable, Understandable, Robust). |
| `list-guidelines` | Lists WCAG 2.2 guidelines, optionally filtered by principle number (1-4). |
| `list-success-criteria` | Lists success criteria with optional filters by level (A/AA/AAA), guideline, or principle. |
| `get-criterion` | Gets full details for a specific success criterion by ref_id (e.g., "1.1.1", "2.4.7"). |
| `get-guideline` | Gets full details for a specific guideline including all its success criteria. |
| `search-wcag` | Searches success criteria by keyword in titles and descriptions. |
| `get-criteria-by-level` | Gets all criteria for a conformance level, optionally including lower levels. |
| `get-wcag-references` | Gets "How to Meet" and "Understanding" links for a specific success criterion. |
| `count-criteria` | Returns counts of success criteria grouped by level, principle, or guideline. |
| `get-server-info` | Returns information about this WCAG MCP server and data source. |

## Data Source

This server uses WCAG 2.2 data from [tenon-io/wcag-as-json](https://github.com/tenon-io/wcag-as-json), included as a git submodule.

The data includes:
- **4 Principles** - Perceivable, Operable, Understandable, Robust
- **13 Guidelines** - Organized under principles
- **86+ Success Criteria** - With levels A, AA, and AAA

### Attribution

This project uses data from [wcag-as-json](https://github.com/tenon-io/wcag-as-json) (MIT License).

> This software includes material copied from or derived from Web Content Accessibility Guidelines (WCAG) 2.2 https://www.w3.org/TR/WCAG22/. Copyright © 2023 W3C® (MIT, ERCIM, Keio, Beihang).

## Installation

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/joe-watkins/wcag-mcp.git

# Or if already cloned, initialize submodules
git submodule update --init --recursive

# Install dependencies
npm install
```

### Updating WCAG Data

To pull the latest WCAG data from the upstream repository:

```bash
npm run update-wcag
```

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

The endpoint uses stateless JSON-RPC over HTTP for serverless compatibility.

## Project Structure

- `src/index.js` - Main MCP server with stdio transport (local use)
- `src/tools.js` - Tool definitions and handlers for WCAG data
- `data/wcag-as-json/` - Git submodule containing WCAG 2.2 JSON data
- `netlify/functions/api.js` - Netlify Function with stateless JSON-RPC handler (remote use)
- `netlify.toml` - Netlify configuration

## License

MIT
## Learn More

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [WCAG 2.2 Specification](https://www.w3.org/TR/WCAG22/)
- [wcag-as-json Repository](https://github.com/tenon-io/wcag-as-json)
