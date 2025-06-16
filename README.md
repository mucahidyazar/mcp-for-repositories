# MCP Server for Repositories

MCP server that scans and provides documentation for all repositories in a specified directory.

## Installation

```bash
bun install
```

## Configuration

Set the `REPOSITORIES_PATH` environment variable to specify the directory containing your repositories:

```bash
export REPOSITORIES_PATH="/Users/mucahidyazar/Desktop/workspace/repositories"
```

If not set, it defaults to the parent directory (`..`).

## Usage

### Development
```bash
bun run dev
```

### Production
```bash
bun run build
bun run start:node
```

Or with environment variable:
```bash
REPOSITORIES_PATH="/path/to/your/repositories" node ./dist/index.js
```
